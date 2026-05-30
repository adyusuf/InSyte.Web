import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import QuestionsPage from '../QuestionsPage';

const apiGetMock = vi.fn();
const apiDeleteMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    delete: (...args: unknown[]) => apiDeleteMock(...args),
  },
}));

function makeCriteriaWithQuestions(overrides = {}) {
  return {
    id: 'cr-1',
    name: 'Sınıf Yönetimi',
    description: 'Açıklama',
    instructions: 'Talimatlar',
    subject: 'Genel',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    questions: [
      { id: 'q-1', question: 'Öğrencilerle göz teması kuruyor mu?', category: 'İletişim', order: 1, isActive: true, createdAt: '2025-01-01T00:00:00Z' },
      { id: 'q-2', question: 'Dersi zamanında bitiriyor mu?', category: 'Zaman', order: 2, isActive: true, createdAt: '2025-01-01T00:00:00Z' },
    ],
    ...overrides,
  };
}

function setupMocks(items = [makeCriteriaWithQuestions()]) {
  apiGetMock.mockResolvedValue({ data: { data: { items } } });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiDeleteMock.mockReset();
});

describe('QuestionsPage', () => {
  it('kriterler yüklenir ve başlıklar görünür', async () => {
    setupMocks();
    renderWithProviders(<QuestionsPage />);

    expect(await screen.findByText('Sınıf Yönetimi')).toBeInTheDocument();
    expect(screen.getByText('2 soru')).toBeInTheDocument();
  });

  it('kriter satırına tıklanınca sorular açılır', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<QuestionsPage />);

    await screen.findByText('Sınıf Yönetimi');
    await user.click(screen.getByText('Sınıf Yönetimi'));

    expect(await screen.findByText(/Öğrencilerle göz teması/)).toBeInTheDocument();
    expect(screen.getByText(/Dersi zamanında/)).toBeInTheDocument();
  });

  it('sorular expand edilince kategori ve sıra bilgisi görünür', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<QuestionsPage />);

    await screen.findByText('Sınıf Yönetimi');
    await user.click(screen.getByText('Sınıf Yönetimi'));

    await screen.findByText('İletişim');
    expect(screen.getByText('Sıra: 1')).toBeInTheDocument();
    expect(screen.getByText('Zaman')).toBeInTheDocument();
  });

  it('aynı kritere tekrar tıklanınca sorular kapanır', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<QuestionsPage />);

    await screen.findByText('Sınıf Yönetimi');
    await user.click(screen.getByText('Sınıf Yönetimi'));
    await screen.findByText(/Öğrencilerle göz teması/);

    await user.click(screen.getByText('Sınıf Yönetimi'));
    await waitFor(() => {
      expect(screen.queryByText(/Öğrencilerle göz teması/)).not.toBeInTheDocument();
    });
  });

  it('arama ile kriter filtreler', async () => {
    setupMocks([
      makeCriteriaWithQuestions({ id: 'cr-1', name: 'Sınıf Yönetimi' }),
      makeCriteriaWithQuestions({ id: 'cr-2', name: 'İletişim Becerileri', questions: [] }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<QuestionsPage />);

    await screen.findByText('Sınıf Yönetimi');
    await screen.findByText('İletişim Becerileri');

    await user.type(screen.getByRole('textbox'), 'İletişim');

    await waitFor(() => {
      expect(screen.queryByText('Sınıf Yönetimi')).not.toBeInTheDocument();
    });
    expect(screen.getByText('İletişim Becerileri')).toBeInTheDocument();
  });

  it('soru silme butonu DELETE isteği gönderir', async () => {
    setupMocks();
    apiDeleteMock.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<QuestionsPage />);

    await screen.findByText('Sınıf Yönetimi');
    await user.click(screen.getByText('Sınıf Yönetimi'));
    await screen.findByText(/Öğrencilerle göz teması/);

    const deleteButtons = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red'),
    );
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith(expect.stringContaining('q-1'));
    });
  });

  it('kriter yokken boş içerik render olur (crash yok)', async () => {
    setupMocks([]);
    renderWithProviders(<QuestionsPage />);

    await waitFor(() => expect(apiGetMock).toHaveBeenCalled());
    // Sayfa render oldu, herhangi bir kriter yok
    expect(screen.queryByText('soru')).not.toBeInTheDocument();
  });
});
