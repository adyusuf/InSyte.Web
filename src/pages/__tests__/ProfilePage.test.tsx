import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import ProfilePage from '../ProfilePage';

const apiPutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: { put: (...args: unknown[]) => apiPutMock(...args) },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u-1',
      email: 'admin@insyte.com',
      firstName: 'Adnan',
      lastName: 'Yusuf',
      role: 'Admin',
    },
  }),
}));

beforeEach(() => {
  apiPutMock.mockReset();
  navigateMock.mockReset();
});

describe('ProfilePage', () => {
  it('kullanıcı adı ve rolünü render eder', () => {
    renderWithProviders(<ProfilePage />);

    // Ad soyad tek node içinde "Adnan Yusuf" olarak render edilir
    expect(screen.getByText('Adnan Yusuf')).toBeInTheDocument();
    // E-posta input'un value'sunda
    expect(screen.getByDisplayValue('admin@insyte.com')).toBeInTheDocument();
    expect(screen.getByText('Yönetici')).toBeInTheDocument();
  });

  it('"Profilim" başlığını render eder', () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Profilim')).toBeInTheDocument();
  });

  it('düzenle modunda ad/soyad inputları görünür', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    // Düzenle butonuna tıkla (Edit2 ikonu olan buton)
    const editBtn = screen.getByRole('button', { name: /düzenle/i });
    await user.click(editBtn);

    expect(screen.getByDisplayValue('Adnan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Yusuf')).toBeInTheDocument();
  });

  it('kaydet butonuna tıklanınca PUT isteği gönderir', async () => {
    apiPutMock.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /düzenle/i }));

    // Ad değiştir
    const firstNameInput = screen.getByDisplayValue('Adnan');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Adnan2');

    await user.click(screen.getByRole('button', { name: /kaydet/i }));

    await waitFor(() => {
      expect(apiPutMock).toHaveBeenCalledWith(
        '/v1/users/u-1',
        expect.objectContaining({ firstName: 'Adnan2', lastName: 'Yusuf' }),
      );
    });
  });

  it('ad boşken kaydet hata mesajı gösterir', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /düzenle/i }));

    const firstNameInput = screen.getByDisplayValue('Adnan');
    await user.clear(firstNameInput);

    await user.click(screen.getByRole('button', { name: /kaydet/i }));

    expect(await screen.findByText(/Ad ve soyadı boş bırakılamaz/i)).toBeInTheDocument();
    expect(apiPutMock).not.toHaveBeenCalled();
  });

  it('iptal butonu düzenlemeyi iptal eder', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /düzenle/i }));
    // Düzenleme modunda input görünür
    expect(screen.getByDisplayValue('Adnan')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^İptal$/i }));

    // İptal sonrası inputlar disabled olur (düzenleme modu kapanır)
    await waitFor(() => {
      const inputs = screen.queryAllByRole('textbox');
      inputs.forEach((input) => expect(input).toBeDisabled());
    });
  });

  it('geri dön butonu navigate(-1) çağırır', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /geri dön/i }));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
