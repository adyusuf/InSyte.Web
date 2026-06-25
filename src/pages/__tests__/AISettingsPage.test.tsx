import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import AISettingsPage from '../AISettingsPage';
import type { AIProvider, AIModel } from '../../types';

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

// useNavigate mock
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

function makeProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    id: 'p-1', name: 'OpenAI Prod', provider: 'openai',
    isActive: true, createdAt: '2025-01-01T00:00:00Z', modelCount: 2,
    hasApiKey: true,
    ...overrides,
  };
}

function makeModel(overrides: Partial<AIModel> = {}): AIModel {
  return {
    id: 'm-1', aiProviderId: 'p-1', providerName: 'OpenAI Prod',
    name: 'GPT-4o', modelId: 'gpt-4o', maxTokens: 128000,
    contextWindow: null, supportsMemory: false, role: 'AudioVideo',
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

describe('AISettingsPage', () => {
  it('AI sistemi tanımlanmamışken boş mesaj gösterir', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { data: [] } });
    renderWithProviders(<AISettingsPage />);

    expect(await screen.findByText(/AI sistemi tanımlanmamış/i)).toBeInTheDocument();
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

    await screen.findByText(/AI sistemi tanımlanmamış/i);
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

  it('model yokken "Model tanımlanmamış" gösterir', async () => {
    apiGetMock
      .mockResolvedValueOnce({ data: { data: [makeProvider({ modelCount: 0 })] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    await user.click(screen.getByText('OpenAI Prod'));

    expect(await screen.findByText(/Model tanımlanmamış/i)).toBeInTheDocument();
  });

  it('provider formu doldurulup kaydet tıklanınca POST gönderir', async () => {
    apiGetMock.mockResolvedValue({ data: { data: [] } });
    apiPostMock.mockResolvedValueOnce({ data: { data: makeProvider() } });

    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText(/AI sistemi tanımlanmamış/i);
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

  it('form yeni sağlayıcıları (DeepSeek, Ollama) seçenek olarak sunar', async () => {
    apiGetMock.mockResolvedValueOnce({ data: { data: [] } });
    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText(/AI sistemi tanımlanmamış/i);
    await user.click(screen.getByRole('button', { name: /Ekle/i }));

    expect(screen.getByRole('option', { name: 'DeepSeek' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Ollama/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qwen' })).toBeInTheDocument();
  });

  it('sağlayıcı düzenle tıklanınca PUT gönderir', async () => {
    apiGetMock.mockResolvedValue({ data: { data: [makeProvider()] } });
    apiPutMock.mockResolvedValueOnce({ data: { data: {} } });
    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    await user.click(screen.getByRole('button', { name: /Sağlayıcıyı düzenle/i }));

    const nameInput = screen.getByPlaceholderText('Ad');
    await user.clear(nameInput);
    await user.type(nameInput, 'Düzenlendi');
    await user.click(screen.getByRole('button', { name: /Kaydet/i }));

    await waitFor(() => {
      expect(apiPutMock).toHaveBeenCalledWith(
        '/ai-providers/p-1',
        expect.objectContaining({ name: 'Düzenlendi' }),
      );
    });
  });

  it('sağlayıcı sil onaylanınca DELETE gönderir', async () => {
    apiGetMock.mockResolvedValue({ data: { data: [makeProvider()] } });
    apiDeleteMock.mockResolvedValueOnce({ data: { data: {} } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    await user.click(screen.getByRole('button', { name: /Sağlayıcıyı sil/i }));

    await waitFor(() => expect(apiDeleteMock).toHaveBeenCalledWith('/ai-providers/p-1'));
  });

  it('hafıza destekli model "hafıza" rozeti gösterir', async () => {
    apiGetMock
      .mockResolvedValueOnce({ data: { data: [makeProvider()] } })
      .mockResolvedValueOnce({ data: { data: [makeModel({ supportsMemory: true, contextWindow: 200000 })] } });
    const user = userEvent.setup();
    renderWithProviders(<AISettingsPage />);

    await screen.findByText('OpenAI Prod');
    await user.click(screen.getByText('OpenAI Prod'));

    await screen.findByText('GPT-4o');
    expect(screen.getByText(/hafıza/i)).toBeInTheDocument();
    expect(screen.getByText(/Bağlam: 200/)).toBeInTheDocument();
  });
});
