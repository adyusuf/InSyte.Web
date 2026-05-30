import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import VideoUploadPage from '../VideoUploadPage';
import type { School, User } from '../../types';

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 's-1', name: 'Anadolu Lisesi', city: 'İstanbul',
    address: 'Kadıköy', phone: '0216 111 00 00', email: 'info@anadolu.edu.tr',
    schoolType: 'Lise', institutionType: 'Devlet',
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    advisorCount: 1, teacherCount: 3, videoCount: 2,
    ...overrides,
  };
}

function makeTeacher(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1', email: 'ahmet@test.com',
    firstName: 'Ahmet', lastName: 'Yılmaz',
    role: 'Teacher', isActive: true,
    ...overrides,
  };
}

function setupMocks(schools: School[] = [makeSchool()], teachers: User[] = [makeTeacher()]) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve({ data: { data: { items: schools } } });
    if (url === '/teachers') return Promise.resolve({ data: { data: { items: teachers } } });
    return Promise.resolve({ data: { data: { items: [] } } });
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
  navigateMock.mockReset();
});

describe('VideoUploadPage', () => {
  it('"Video Yükle" başlığını render eder', async () => {
    setupMocks();
    renderWithProviders(<VideoUploadPage />);

    expect(screen.getByText('Video Yükle')).toBeInTheDocument();
  });

  it('"Videolara dön" linki görünür', async () => {
    setupMocks();
    renderWithProviders(<VideoUploadPage />);

    expect(screen.getByText('Videolara dön')).toBeInTheDocument();
  });

  it('okulları select listesinde gösterir', async () => {
    setupMocks([makeSchool({ name: 'Anadolu Lisesi' })]);
    renderWithProviders(<VideoUploadPage />);

    expect(await screen.findByText('Anadolu Lisesi')).toBeInTheDocument();
  });

  it('okul seçilmeden öğretmen select disabled olur', async () => {
    setupMocks();
    renderWithProviders(<VideoUploadPage />);

    await screen.findByText('Anadolu Lisesi');
    // İkinci combobox = öğretmen seçici
    const [, teacherSelect] = screen.getAllByRole('combobox');
    expect(teacherSelect).toBeDisabled();
  });

  it('okul seçilince öğretmen listesi aktif olur', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<VideoUploadPage />);

    await screen.findByText('Anadolu Lisesi');
    // Birinci combobox = okul seçici
    const [schoolSelect, teacherSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(schoolSelect, 's-1');

    await waitFor(() => {
      expect(teacherSelect).not.toBeDisabled();
    });
  });

  it('drag-drop alanı "Video dosyasını sürükleyin" metni içerir', async () => {
    setupMocks();
    renderWithProviders(<VideoUploadPage />);

    expect(screen.getByText('Video dosyasını sürükleyin')).toBeInTheDocument();
  });

  it('dosya seçilince dosya adı ve boyutu görünür', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<VideoUploadPage />);

    const file = new File(['video content'], 'ders.mp4', { type: 'video/mp4' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    expect(await screen.findByText('ders.mp4')).toBeInTheDocument();
  });

  it('dosya seçilmeden Yükle butonu disabled olur', async () => {
    setupMocks();
    renderWithProviders(<VideoUploadPage />);

    await screen.findByText('Anadolu Lisesi');
    expect(screen.getByRole('button', { name: /^Yükle$/i })).toBeDisabled();
  });

  it('İptal butonu /videos sayfasına yönlendirir', async () => {
    setupMocks();
    const user = userEvent.setup();
    renderWithProviders(<VideoUploadPage />);

    await user.click(screen.getByRole('button', { name: /İptal/i }));
    expect(navigateMock).toHaveBeenCalledWith('/videos');
  });
});
