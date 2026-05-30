import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import CriteriaPage from '../CriteriaPage';
import type { Criteria } from '../../types';

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

function pagedResponse(items: Criteria[], pageSize = 20) {
  return { data: { data: { items, totalCount: items.length, page: 1, pageSize } } };
}

function makeCriteria(overrides: Partial<Criteria> = {}): Criteria {
  return {
    id: 'cr-1', name: 'Sınıf Yönetimi', description: 'Öğretmenin sınıf yönetimini değerlendirir.',
    instructions: 'Aşağıdaki soruları cevaplayın...', subject: 'Genel',
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
  apiPutMock.mockReset();
  apiDeleteMock.mockReset();
});

describe('CriteriaPage', () => {
  it('/criteria endpointini çağırır', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([makeCriteria()]));
    renderWithProviders(<CriteriaPage />);

    await screen.findByText('Sınıf Yönetimi');
    expect(apiGetMock).toHaveBeenCalledWith(
      '/criteria',
      expect.objectContaining({ params: expect.objectContaining({ page: 1 }) }),
    );
  });

  it('kriter adını, açıklamasını ve konusunu render eder', async () => {
    apiGetMock.mockResolvedValueOnce(
      pagedResponse([makeCriteria({ name: 'İletişim', description: 'Sözel iletişim becerileri', subject: 'Türkçe' })]),
    );
    renderWithProviders(<CriteriaPage />);

    await screen.findByText('İletişim');
    expect(screen.getByText('Sözel iletişim becerileri')).toBeInTheDocument();
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('pasif kriter "Pasif" rozeti gösterir', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([makeCriteria({ isActive: false })]));
    renderWithProviders(<CriteriaPage />);

    await screen.findByText('Sınıf Yönetimi');
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('"Ekle" butonu modal açar', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([]));
    const user = userEvent.setup();
    renderWithProviders(<CriteriaPage />);

    // Sayfanın yüklenmesini bekle
    await waitFor(() => expect(apiGetMock).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /ekle/i }));

    // FormModal açıldı mı?
    expect(await screen.findByPlaceholderText(/talimatlar|instruction/i)).toBeInTheDocument();
  });

  it('düzenle butonuna tıklanınca FormModal açılır ve başlık güncellenir', async () => {
    apiGetMock.mockResolvedValueOnce(pagedResponse([makeCriteria({ name: 'Test Kriteri' })]));
    const user = userEvent.setup();
    renderWithProviders(<CriteriaPage />);

    await screen.findByText('Test Kriteri');

    // Her kriter satırında edit (mavi) ve delete (kırmızı) butonu var.
    // Mavi butonlar: Ekle (header) + her satır edit = ilk satır edit = [1]
    const blueButtons = screen.getAllByRole('button').filter((b) =>
      b.className.includes('text-blue-600'),
    );
    // blueButtons[0] = header "Ekle", blueButtons[1] = satır edit
    await user.click(blueButtons[1]);

    // FormModal açıldı — Kaydet butonu görünmeli
    expect(await screen.findByRole('button', { name: /Kaydet/i })).toBeInTheDocument();
  });

  it('silme butonuna tıklanınca DELETE isteği gönderir', async () => {
    apiGetMock.mockResolvedValue(pagedResponse([makeCriteria({ id: 'cr-1' })]));
    apiDeleteMock.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<CriteriaPage />);

    await screen.findByText('Sınıf Yönetimi');
    // Kırmızı buton (delete)
    const redBtn = screen.getAllByRole('button').find((b) => b.className.includes('red'))!;
    await user.click(redBtn);

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith(expect.stringContaining('cr-1'));
    });
  });
});
