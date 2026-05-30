import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import AISettingsPage from '../AISettingsPage';
import type { AIProvider, AIModel } from '../../types';

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}));

// useNavigate mock
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

function makeProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    id: 'p-1', name: 'OpenAI Prod', provider: 'openai',
    isActive: true, createdAt: '2025-01-01T00:00:00Z', modelCount: 2,
    ...overrides,
  };
}

function makeModel(overrides: Partial<AIModel> = {}): AIModel {
  return {
    id: 'm-1', aiProviderId: 'p-1', providerName: 'OpenAI Prod',
    name: 'GPT-4o', modelId: 'gpt-4o', maxTokens: 128000,
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
});

describe('AISettingsPage', () => {
  it('AI sistemi tanımlanmamışken boş mesaj gösterir', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { data: [] } });
    renderWithProviders(<AISettingsPage />);

    expect(await screen.findByText(/AI sistemi tanimlanmamis/i)).toBeInTheDocument();
  });

  it('sağlayıcı listesini ad, provider ve model sayısıyla render eder', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { data: [makeProvider({ name: 'OpenAI Prod', modelCount: 3 })] } });
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    expect(screen.getByText('(openai)')).toBeInTheDocument();
    expect(screen.getByText('3 model')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('pasif sağlayıcı "Pasif" rozeti gösterir', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { data: [makeProvider({ isActive: false })] } });
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('"Ekle" tıklayınca provider formu açılır', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { data: [] } });
    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText(/AI sistemi tanimlanmamis/i);
    await user.click(screen.getByRole('button', { name: /Ekle/i }));

    expect(screen.getByPlaceholderText('Ad')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('API Key')).toBeInTheDocument();
  });

  it('provider satırına tıklanınca modeller yüklenir', async () => {
    apiGetMock
      .mockResolvedValueOnce({ data: { data: [makeProvider()] } })  // providers
      .mockResolvedValueOnce({ data: { data: [makeModel()] } });     // models for p-1

    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    await user.click(screen.getByText('OpenAI Prod'));

    await screen.findByText('GPT-4o');
    expect(screen.getByText('(gpt-4o)')).toBeInTheDocument();
    expect(screen.getByText(/128/)).toBeInTheDocument();
  });

  it('model yokken "Model tanimlanmamis" gösterir', async () => {
    apiGetMock
      .mockResolvedValueOnce({ data: { data: [makeProvider({ modelCount: 0 })] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    await user.click(screen.getByText('OpenAI Prod'));

    expect(await screen.findByText(/Model tanimlanmamis/i)).toBeInTheDocument();
  });

  it('provider formu doldurulup kaydet tıklanınca POST gönderir', async () => {
    apiGetMock.mockResolvedValue({ data: { data: [] } });
    apiPostMock.mockResolvedValueOnce({ data: { data: makeProvider() } });

    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText(/AI sistemi tanimlanmamis/i);
    await user.click(screen.getByRole('button', { name: /Ekle/i }));

    await user.type(screen.getByPlaceholderText('Ad'), 'Yeni Sağlayıcı');
    await user.type(screen.getByPlaceholderText('API Key'), 'sk-test-key');
    await user.click(screen.getByRole('button', { name: /Kaydet/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith(
        '/ai-providers',
        expect.objectContaining({ name: 'Yeni Sağlayıcı', apiKey: 'sk-test-key' }),
      );
    });
  });
});
