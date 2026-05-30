import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import SubjectsPage from '../SubjectsPage';
import type { Subject, School } from '../../types';

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();
const apiPutMock = vi.fn();
const apiDeleteMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
    put: (...args: unknown[]) => apiPutMock(...args),
    delete: (...args: unknown[]) => apiDeleteMock(...args),
  },
}));

function pagedResponse<T>(items: T[], pageSize = 20) {
  return { data: { data: { items, totalCount: items.length, page: 1, pageSize } } };
}

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 's-1', name: 'Anadolu Lisesi', isActive: true,
    createdAt: '2025-01-01T00:00:00Z', advisorCount: 1, teacherCount: 5, videoCount: 2,
    ...overrides,
  };
}

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1', schoolId: 's-1', name: 'Matematik', branch: 'Sayısal',
    level: '9-12', weeklyHours: 4, isActive: true, createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function setupMocks(subjects: Subject[] = [], schools: School[] = [makeSchool()]) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve(pagedResponse(schools, 100));
    if (url === '/subjects') return Promise.resolve(pagedResponse(subjects));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
  apiPutMock.mockReset();
  apiDeleteMock.mockReset();
});

describe('SubjectsPage', () => {
  it('/subjects endpointini doğru parametrelerle çağırır', async () => {
    setupMocks([makeSubject()]);
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Matematik');
    expect(apiGetMock).toHaveBeenCalledWith('/subjects', {
      params: { schoolId: undefined, search: '', page: 1, pageSize: 20 },
    });
  });

  it('liste boşken "Ders bulunamadı" gösterir', async () => {
    setupMocks([]);
    renderWithProviders(<SubjectsPage />);

    expect(await screen.findByText('Ders bulunamadı')).toBeInTheDocument();
  });

  it('ders satırını branş, seviye, haftalık saat ve durumla render eder', async () => {
    setupMocks([makeSubject({ branch: 'Sayısal', level: '9-12', weeklyHours: 4 })]);
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Matematik');
    expect(screen.getByText('Sayısal')).toBeInTheDocument();
    expect(screen.getByText('9-12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('pasif ders "Pasif" rozeti gösterir', async () => {
    setupMocks([makeSubject({ isActive: false })]);
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Matematik');
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('branş ve seviye boşken "—" gösterir', async () => {
    setupMocks([makeSubject({ branch: '', level: '' })]);
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Matematik');
    // iki tane "—" olmalı (branş + seviye)
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('"Yeni Ders" butonu modal açar ve form görünür', async () => {
    setupMocks([]);
    const user = userEvent.setup();
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Ders bulunamadı');
    await user.click(screen.getByRole('button', { name: /Yeni Ders/i }));

    // Modal açıldığında Okul seçin + Ders Adı placeholder görünür
    expect(await screen.findByText('Okul seçin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Matematik')).toBeInTheDocument();
  });

  it('düzenle butonuna tıklayınca "Dersi Düzenle" modal açılır', async () => {
    setupMocks([makeSubject({ name: 'Fizik' })]);
    const user = userEvent.setup();
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Fizik');
    await user.click(screen.getByTitle('Düzenle'));

    expect(await screen.findByText('Dersi Düzenle')).toBeInTheDocument();
  });

  it('silme onaylanırsa DELETE isteği gönderir', async () => {
    setupMocks([makeSubject({ id: 'sub-1', schoolId: 's-1' })]);
    apiDeleteMock.mockResolvedValueOnce({});
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    const user = userEvent.setup();
    renderWithProviders(<SubjectsPage />);

    await screen.findByText('Matematik');
    await user.click(screen.getByTitle('Sil'));

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith('/subjects/sub-1?schoolId=s-1');
    });
  });
});
