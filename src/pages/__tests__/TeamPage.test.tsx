import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitForElementToBeRemoved, within } from '../../test/utils';
import TeamPage from '../TeamPage';
import type { User } from '../../types';

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}));

function pagedResponse(items: User[]) {
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

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'a@insyte.com',
    firstName: 'Ada',
    lastName: 'Yılmaz',
    role: 'Advisor',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
});

describe('TeamPage rol filtresi', () => {
  it('/users çağrısına yalnız Admin ve Advisor rolleri ile istek gönderir', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    renderWithProviders(<TeamPage />);

    await screen.findByText('Ekip üyesi bulunamadı');

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith('/users', {
      params: {
        search: '',
        page: 1,
        pageSize: 20,
        roles: ['Admin', 'Advisor'],
      },
    });
  });

  it('SchoolAdmin/Teacher rollerini sorguda asla istemez', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    renderWithProviders(<TeamPage />);

    await screen.findByText('Ekip üyesi bulunamadı');

    const callArgs = apiGetMock.mock.calls[0][1] as { params: { roles: string[] } };
    expect(callArgs.params.roles).not.toContain('SchoolAdmin');
    expect(callArgs.params.roles).not.toContain('Teacher');
  });

  it('Admin kullanıcıyı "Yönetici", Advisor kullanıcıyı "Danışman" olarak gösterir', async () => {
    apiGetMock.mockResolvedValueOnce(
      pagedResponse([
        makeUser({ id: '1', firstName: 'Ali', lastName: 'Veli', role: 'Admin' }),
        makeUser({ id: '2', firstName: 'Ayşe', lastName: 'Demir', role: 'Advisor' }),
      ]),
    );
    renderWithProviders(<TeamPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    const adminRow = screen.getByText('Ali Veli').closest('tr')!;
    const advisorRow = screen.getByText('Ayşe Demir').closest('tr')!;
    expect(within(adminRow).getByText('Yönetici')).toBeInTheDocument();
    expect(within(advisorRow).getByText('Danışman')).toBeInTheDocument();
  });

  it('"Yeni Üye" formundaki rol seçenekleri yalnız Admin ve Advisor olur', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    const user = userEvent.setup();
    renderWithProviders(<TeamPage />);

    await screen.findByText('Ekip üyesi bulunamadı');
    await user.click(screen.getByRole('button', { name: /Yeni Üye/i }));

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);

    expect(optionValues).toEqual(['Admin', 'Advisor']);
    expect(optionValues).not.toContain('SchoolAdmin');
    expect(optionValues).not.toContain('Teacher');
  });

  it('liste boşken "Ekip üyesi bulunamadı" gösterir (eski "Kullanıcı" metni değil)', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    renderWithProviders(<TeamPage />);

    expect(await screen.findByText('Ekip üyesi bulunamadı')).toBeInTheDocument();
    expect(screen.queryByText('Kullanıcı bulunamadı')).not.toBeInTheDocument();
  });

  it('arama input placeholder\'ı "Ekip üyesi ara..." olur', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    renderWithProviders(<TeamPage />);

    await screen.findByText('Ekip üyesi bulunamadı');
    expect(screen.getByPlaceholderText('Ekip üyesi ara...')).toBeInTheDocument();
  });
});
