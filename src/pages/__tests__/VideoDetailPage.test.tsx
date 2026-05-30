import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import VideoDetailPage from '../VideoDetailPage';
import type { Video, Evaluation } from '../../types';

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'v-1' }), useNavigate: () => vi.fn() };
});

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: 'v-1', title: 'Matematik Dersi', filePath: '/uploads/math.mp4',
    fileSize: 52428800, schoolId: 's-1', teacherUserId: 'u-1',
    uploadedByUserId: 'u-1', status: 'Uploaded',
    schoolName: 'Anadolu Lisesi', teacherName: 'Ahmet Yılmaz',
    evaluationCount: 0, createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    id: 'e-1', videoId: 'v-1', criteriaId: 'cr-1', aiModelId: 'm-1',
    criteriaName: 'Sınıf Yönetimi', aiModelName: 'GPT-4o',
    status: 'Completed', tokenUsageInput: 1000, tokenUsageOutput: 500,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function pagedResponse<T>(items: T[]) {
  return { data: { data: { items, totalCount: items.length, page: 1, pageSize: 100 } } };
}

function setupMocks(video = makeVideo(), evaluations: Evaluation[] = []) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/videos/v-1') return Promise.resolve({ data: { data: video } });
    if (url === '/evaluations') return Promise.resolve(pagedResponse(evaluations));
    if (url === '/criteria') return Promise.resolve(pagedResponse([]));
    if (url === '/ai-providers') return Promise.resolve({ data: { data: [] } });
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
});

describe('VideoDetailPage', () => {
  it('yüklenirken "Yukleniyor..." gösterir', () => {
    apiGetMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<VideoDetailPage />);

    expect(screen.getByText('Yukleniyor...')).toBeInTheDocument();
  });

  it('video bulunamazsa "Video bulunamadi" gösterir', async () => {
    apiGetMock.mockResolvedValue({ data: { data: null } });
    renderWithProviders(<VideoDetailPage />);

    expect(await screen.findByText('Video bulunamadi')).toBeInTheDocument();
  });

  it('video başlığı, okul ve öğretmen adını render eder', async () => {
    setupMocks();
    renderWithProviders(<VideoDetailPage />);

    expect(await screen.findByText('Matematik Dersi')).toBeInTheDocument();
    expect(screen.getByText('Anadolu Lisesi • Ahmet Yılmaz')).toBeInTheDocument();
  });

  it('dosya boyutunu MB cinsinden gösterir', async () => {
    setupMocks(makeVideo({ fileSize: 52428800 }));
    renderWithProviders(<VideoDetailPage />);

    await screen.findByText('Matematik Dersi');
    expect(screen.getByText('50.00 MB')).toBeInTheDocument();
  });

  it('değerlendirme yokken "Degerlendirme yok" gösterir', async () => {
    setupMocks();
    renderWithProviders(<VideoDetailPage />);

    expect(await screen.findByText('Degerlendirme yok')).toBeInTheDocument();
  });

  it('değerlendirme listesini kriter adıyla render eder', async () => {
    setupMocks(makeVideo(), [makeEvaluation({ criteriaName: 'Sınıf Yönetimi' })]);
    renderWithProviders(<VideoDetailPage />);

    expect(await screen.findByText('Sınıf Yönetimi')).toBeInTheDocument();
    expect(screen.getByText('GPT-4o')).toBeInTheDocument();
  });

  it('"Yeni Degerlendirme" butonu modal açar', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<VideoDetailPage />);

    await screen.findByText('Matematik Dersi');
    await user.click(screen.getByRole('button', { name: /Yeni Degerlendirme/i }));

    expect(await screen.findByText('Kriter secin')).toBeInTheDocument();
    expect(screen.getByText('Modeli secin')).toBeInTheDocument();
  });

  it('"Videolara don" geri linki görünür', async () => {
    setupMocks();
    renderWithProviders(<VideoDetailPage />);

    await screen.findByText('Matematik Dersi');
    expect(screen.getByText('Videolara don')).toBeInTheDocument();
  });

  it('değerlendirme hatası varsa hata mesajını gösterir', async () => {
    setupMocks(makeVideo(), [makeEvaluation({ status: 'Failed', errorMessage: 'Zaman aşımı' })]);
    renderWithProviders(<VideoDetailPage />);

    expect(await screen.findByText('Zaman aşımı')).toBeInTheDocument();
  });
});
