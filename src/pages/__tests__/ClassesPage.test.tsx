import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import ClassesPage from '../ClassesPage';
import type { Class, School } from '../../types';

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

function makeClass(overrides: Partial<Class> = {}): Class {
  return {
    id: 'c-1', schoolId: 's-1', name: '9-A', level: 'Level9',
    type: 'A', isActive: true, createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function setupMocks(classes: Class[] = [], schools: School[] = [makeSchool()]) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve(pagedResponse(schools, 100));
    if (url === '/classes') return Promise.resolve(pagedResponse(classes));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
  apiPutMock.mockReset();
  apiDeleteMock.mockReset();
});

describe('ClassesPage', () => {
  it('/classes endpointini doğru parametrelerle çağırır', async () => {
    setupMocks([makeClass()]);
    renderWithProviders(<ClassesPage />);

    await screen.findByText('9-A');
    expect(apiGetMock).toHaveBeenCalledWith('/classes', {
      params: { schoolId: undefined, search: '', page: 1, pageSize: 20 },
    });
  });

  it('liste boşken "Sınıf bulunamadı" gösterir', async () => {
    setupMocks([]);
    renderWithProviders(<ClassesPage />);

    expect(await screen.findByText('Sınıf bulunamadı')).toBeInTheDocument();
  });

  it('sınıfı level etiketi ve durum rozetiyle render eder', async () => {
    setupMocks([makeClass({ level: 'Level9', isActive: true })]);
    renderWithProviders(<ClassesPage />);

    await screen.findByText('9-A');
    expect(screen.getByText('9. Sınıf')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('pasif sınıf "Pasif" rozeti gösterir', async () => {
    setupMocks([makeClass({ isActive: false })]);
    renderWithProviders(<ClassesPage />);

    await screen.findByText('9-A');
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('"Yeni Sınıf" butonu modal açar ve form görünür', async () => {
    setupMocks([]);
    const user = userEvent.setup();
    renderWithProviders(<ClassesPage />);

    await screen.findByText('Sınıf bulunamadı');
    await user.click(screen.getByRole('button', { name: /Yeni Sınıf/i }));

    // Modal açıldığında "Okul seçin" placeholder'ı ve Sınıf Adı alanı görünür
    expect(await screen.findByText('Okul seçin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('9-A')).toBeInTheDocument();
  });

  it('düzenle butonuna tıklayınca modal "Sınıfı Düzenle" başlığıyla açılır', async () => {
    setupMocks([makeClass({ name: '10-B' })]);
    const user = userEvent.setup();
    renderWithProviders(<ClassesPage />);

    await screen.findByText('10-B');
    await user.click(screen.getByTitle('Düzenle'));

    expect(await screen.findByText('Sınıfı Düzenle')).toBeInTheDocument();
  });

  it('silme onaylanırsa DELETE isteği gönderir', async () => {
    setupMocks([makeClass({ id: 'c-1', schoolId: 's-1' })]);
    apiDeleteMock.mockResolvedValueOnce({});
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    const user = userEvent.setup();
    renderWithProviders(<ClassesPage />);

    await screen.findByText('9-A');
    await user.click(screen.getByTitle('Sil'));

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith('/classes/c-1?schoolId=s-1');
    });
  });

  it('silme iptal edilirse DELETE gönderilmez', async () => {
    setupMocks([makeClass()]);
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    const user = userEvent.setup();
    renderWithProviders(<ClassesPage />);

    await screen.findByText('9-A');
    await user.click(screen.getByTitle('Sil'));

    expect(apiDeleteMock).not.toHaveBeenCalled();
  });
});
