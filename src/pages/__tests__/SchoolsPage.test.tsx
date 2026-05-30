import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitForElementToBeRemoved } from '../../test/utils';
import SchoolsPage from '../SchoolsPage';
import type { School } from '../../types';

const apiGetMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function pagedResponse(items: School[]) {
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

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'school-1',
    name: 'Anadolu Lisesi',
    city: 'İstanbul',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    advisorCount: 2,
    teacherCount: 5,
    videoCount: 10,
    ...overrides,
  };
}

beforeEach(() => {
  apiGetMock.mockReset();
});

describe('SchoolsPage', () => {
  it('/schools endpointini search/page parametreleriyle çağırır', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([makeSchool()]));
    renderWithProviders(<SchoolsPage />);

    await screen.findByText('Anadolu Lisesi');
    expect(apiGetMock).toHaveBeenCalledWith('/schools', {
      params: { search: '', page: 1, pageSize: 20 },
    });
  });

  it('liste boş geldiğinde "Okul bulunamadı" mesajı gösterir', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    renderWithProviders(<SchoolsPage />);

    expect(await screen.findByText('Okul bulunamadı')).toBeInTheDocument();
  });

  it('okul satırını ad, şehir ve sayaçlarla render eder', async () => {
    apiGetMock.mockResolvedValueOnce(
      pagedResponse([makeSchool({ name: 'Vakıf Koleji', city: 'Ankara', teacherCount: 7, videoCount: 3 })]),
    );
    renderWithProviders(<SchoolsPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    expect(screen.getByText('Vakıf Koleji')).toBeInTheDocument();
    expect(screen.getByText('Ankara')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('"Yeni Okul" butonu Modal açar', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    const user = userEvent.setup();
    renderWithProviders(<SchoolsPage />);

    await screen.findByText('Okul bulunamadı');
    await user.click(screen.getByRole('button', { name: /Yeni Okul/i }));

    expect(await screen.findByText('Yeni Okul Ekle')).toBeInTheDocument();
  });
});
