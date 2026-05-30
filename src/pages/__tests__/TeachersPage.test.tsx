import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitForElementToBeRemoved } from '../../test/utils';
import TeachersPage from '../TeachersPage';
import type { User, School } from '../../types';

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}));

function pagedResponse<T>(items: T[]) {
  return {
    data: {
      data: {
        items,
        totalCount: items.length,
        page: 1,
        pageSize: 20,
      },
    },
  };
}

function makeTeacher(overrides: Partial<User> = {}): User {
  return {
    id: 't-1',
    email: 'ogretmen@insyte.com',
    firstName: 'Ayşe',
    lastName: 'Kaya',
    role: 'Teacher',
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 's-1',
    name: 'Atatürk İlkokulu',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    advisorCount: 2,
    teacherCount: 10,
    videoCount: 5,
    ...overrides,
  };
}

// Mock apiGetMock to route by URL
function setupMocks(teachers: User[], schools: School[] = []) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve(pagedResponse(schools));
    if (url === '/teachers') return Promise.resolve(pagedResponse(teachers));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
});

describe('TeachersPage', () => {
  it('/teachers çağrısında doğru parametreleri gönderir', async () => {
    setupMocks([]);
    renderWithProviders(<TeachersPage />);

    await screen.findByText('Öğretmen bulunamadı');

    const teachersCall = apiGetMock.mock.calls.find(
      (call) => call[0] === '/teachers',
    );
    expect(teachersCall).toBeDefined();
    expect(teachersCall![1]).toEqual({
      params: {
        schoolId: undefined,
        search: '',
        page: 1,
        pageSize: 20,
      },
    });
  });

  it('öğretmen listesi boşken "Öğretmen bulunamadı" gösterir', async () => {
    setupMocks([]);
    renderWithProviders(<TeachersPage />);

    expect(await screen.findByText('Öğretmen bulunamadı')).toBeInTheDocument();
  });

  it('öğretmen satırını ad-soyad ve e-posta ile render eder', async () => {
    const teacher = makeTeacher({
      id: 't-42',
      firstName: 'Mehmet',
      lastName: 'Demir',
      email: 'mehmet.demir@okul.com',
    });
    setupMocks([teacher]);
    renderWithProviders(<TeachersPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    expect(screen.getByText('Mehmet Demir')).toBeInTheDocument();
    expect(screen.getByText('mehmet.demir@okul.com')).toBeInTheDocument();
  });

  it('okul filtresi /schools endpointini çağırır ve okulları listeler', async () => {
    const school = makeSchool({ id: 's-99', name: 'Fatih Ortaokulu' });
    setupMocks([], [school]);
    renderWithProviders(<TeachersPage />);

    await screen.findByText('Öğretmen bulunamadı');

    // /schools çağrısı yapılmış olmalı
    const schoolsCall = apiGetMock.mock.calls.find((call) => call[0] === '/schools');
    expect(schoolsCall).toBeDefined();

    // Okul adı filtre dropdown'ında görünmeli
    expect(screen.getAllByText('Fatih Ortaokulu').length).toBeGreaterThan(0);
  });

  it('"Yeni Öğretmen" butonu modal açar', async () => {
    setupMocks([]);
    const user = userEvent.setup();
    renderWithProviders(<TeachersPage />);

    await screen.findByText('Öğretmen bulunamadı');

    await user.click(screen.getByRole('button', { name: /Yeni Öğretmen/i }));

    expect(screen.getByText('Yeni Öğretmen Ekle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ad')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Soyad')).toBeInTheDocument();
  });
});
