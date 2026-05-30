import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitForElementToBeRemoved } from '../../test/utils';
import VideosPage from '../VideosPage';
import type { Video, School } from '../../types';

const apiGetMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: { get: (...args: unknown[]) => apiGetMock(...args) },
}));

function pagedResponse<T>(items: T[]) {
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

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 's-1',
    name: 'Atatürk İlkokulu',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    advisorCount: 2,
    teacherCount: 10,
    videoCount: 5,
    ...overrides,
  };
}

function setupMocks(videos: Video[], schools: School[] = []) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve(pagedResponse(schools));
    if (url === '/videos') return Promise.resolve(pagedResponse(videos));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
});

describe('VideosPage', () => {
  it('/videos çağrısında doğru parametreleri gönderir', async () => {
    setupMocks([]);
    renderWithProviders(<VideosPage />);

    await screen.findByText('Video bulunamadı');

    const videosCall = apiGetMock.mock.calls.find((call) => call[0] === '/videos');
    expect(videosCall).toBeDefined();
    expect(videosCall![1]).toEqual({
      params: {
        schoolId: undefined,
        search: '',
        page: 1,
        pageSize: 20,
      },
    });
  });

  it('video listesi boşken "Video bulunamadı" gösterir', async () => {
    setupMocks([]);
    renderWithProviders(<VideosPage />);

    expect(await screen.findByText('Video bulunamadı')).toBeInTheDocument();
  });

  it('video satırını başlık, okul, öğretmen ve durum ile render eder', async () => {
    const video = makeVideo({
      id: 'v-99',
      title: 'Türkçe Dersi',
      schoolName: 'Fatih Ortaokulu',
      teacherName: 'Mehmet Demir',
      status: 'Evaluated',
    });
    setupMocks([video]);
    renderWithProviders(<VideosPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    expect(screen.getByText('Türkçe Dersi')).toBeInTheDocument();
    expect(screen.getByText('Fatih Ortaokulu')).toBeInTheDocument();
    expect(screen.getByText('Mehmet Demir')).toBeInTheDocument();
  });

  it('okul filtresi /schools endpointini çağırır ve okulları listeler', async () => {
    const school = makeSchool({ id: 's-77', name: 'Cumhuriyet Lisesi' });
    setupMocks([], [school]);
    renderWithProviders(<VideosPage />);

    await screen.findByText('Video bulunamadı');

    const schoolsCall = apiGetMock.mock.calls.find((call) => call[0] === '/schools');
    expect(schoolsCall).toBeDefined();

    expect(screen.getAllByText('Cumhuriyet Lisesi').length).toBeGreaterThan(0);
  });

  it('video başlığı /videos/:id rotasına link olarak render edilir', async () => {
    const video = makeVideo({ id: 'v-42', title: 'Fen Bilimleri Dersi' });
    setupMocks([video]);
    renderWithProviders(<VideosPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    const link = screen.getByRole('link', { name: 'Fen Bilimleri Dersi' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/videos/v-42');
  });
});
