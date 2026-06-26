import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitForElementToBeRemoved } from '../../test/utils';
import { fireEvent } from '@testing-library/react';
import VideosPage from '../VideosPage';
import type { Video } from '../../types';

const apiGetMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: { get: (...args: unknown[]) => apiGetMock(...args) },
}));

function pagedResponse<T>(items: T[]) {
  return { data: { data: { items, totalCount: items.length, page: 1, pageSize: 100 } } };
}

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: 'v-1',
    title: 'Matematik Dersi',
    fileSize: 1024 * 1024 * 50, // 50 MB
    schoolId: 's-1',
    schoolName: 'Atatürk İlkokulu',
    teacherUserId: 'u-1',
    teacherName: 'Ayşe Kaya',
    subject: 'Matematik',
    status: 'Uploaded',
    createdAt: '2025-03-01T00:00:00Z',
    evaluationCount: 0,
    ...overrides,
  };
}

function setupMocks(videos: Video[]) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/videos') return Promise.resolve(pagedResponse(videos));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
});

describe('VideosPage', () => {
  it('/videos çağrısı pageSize=100 ile yapılır', async () => {
    setupMocks([]);
    renderWithProviders(<VideosPage />);

    await screen.findByText('Video bulunamadı');

    const call = apiGetMock.mock.calls.find((c) => c[0] === '/videos');
    expect(call).toBeDefined();
    expect(call![1]).toEqual({ params: { pageSize: 100 } });
  });

  it('video yokken "Video bulunamadı" gösterir', async () => {
    setupMocks([]);
    renderWithProviders(<VideosPage />);

    expect(await screen.findByText('Video bulunamadı')).toBeInTheDocument();
  });

  it('okul → öğretmen → video akordiyonu kademeli açılır', async () => {
    setupMocks([makeVideo()]);
    renderWithProviders(<VideosPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    // Okul başlığı görünür; öğretmen ve video kapalı (gizli)
    const okul = screen.getByText('Atatürk İlkokulu');
    expect(okul).toBeInTheDocument();
    expect(screen.queryByText('Ayşe Kaya')).not.toBeInTheDocument();

    // Okula tıkla → öğretmen görünür, video hâlâ gizli
    fireEvent.click(okul);
    const ogretmen = screen.getByText('Ayşe Kaya');
    expect(ogretmen).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Matematik Dersi/ })).not.toBeInTheDocument();

    // Öğretmene tıkla → video linki /videos/:id
    fireEvent.click(ogretmen);
    const link = screen.getByRole('link', { name: /Matematik Dersi/ });
    expect(link).toHaveAttribute('href', '/videos/v-1');
  });
});
