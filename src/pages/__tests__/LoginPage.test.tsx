import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import LoginPage from '../LoginPage';

const navigateMock = vi.fn();
const loginMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

beforeEach(() => {
  navigateMock.mockReset();
  loginMock.mockReset();
});

describe('LoginPage', () => {
  it('e-posta ve şifre alanlarını ve giriş butonunu render eder', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByPlaceholderText('admin@insyte.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Giris Yap/i })).toBeInTheDocument();
  });

  it('başarılı login sonrası ana sayfaya yönlendirir', async () => {
    loginMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByPlaceholderText('admin@insyte.com'), 'admin@insyte.com');
    await user.type(screen.getByPlaceholderText('********'), 'Admin@123');
    await user.click(screen.getByRole('button', { name: /Giris Yap/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin@insyte.com', 'Admin@123');
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('login başarısız olursa Türkçe hata mesajı gösterir ve yönlendirme yapmaz', async () => {
    loginMock.mockRejectedValueOnce(new Error('401'));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByPlaceholderText('admin@insyte.com'), 'wrong@insyte.com');
    await user.type(screen.getByPlaceholderText('********'), 'bad');
    await user.click(screen.getByRole('button', { name: /Giris Yap/i }));

    expect(await screen.findByText(/Gecersiz e-posta veya sifre/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
