import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor } from '../../test/utils';
import SchoolDetailPage from '../SchoolDetailPage';
import type { School, SchoolTeacher } from '../../types';

const apiGetMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: { get: (...args: unknown[]) => apiGetMock(...args) },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'school-1' }), useNavigate: () => vi.fn() };
});

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'school-1', name: 'Anadolu Lisesi', city: 'İstanbul',
    address: 'Kadıköy Mah.', phone: '0216 555 00 00', email: 'info@anadolu.edu.tr',
    schoolType: 'Lise', institutionType: 'Devlet',
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    advisorCount: 2, teacherCount: 10, videoCount: 5,
    ...overrides,
  };
}

function makeTeacher(overrides: Partial<SchoolTeacher> = {}): SchoolTeacher {
  return {
    id: 'u-1', userId: 'user-1', firstName: 'Ahmet', lastName: 'Yılmaz',
    email: 'ahmet@test.com', role: 'Teacher', assignedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function setupMocks(school = makeSchool(), teachers: SchoolTeacher[] = [], advisors: SchoolTeacher[] = []) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools/school-1') return Promise.resolve({ data: { data: school } });
    if (url?.endsWith('/teachers')) return Promise.resolve({ data: { data: teachers } });
    if (url?.endsWith('/advisors')) return Promise.resolve({ data: { data: advisors } });
    // SchoolDetailsTab + olası diğer alt bileşen çağrıları — boş liste döndür
    return Promise.resolve({ data: { data: [] } });
  });
}

beforeEach(() => apiGetMock.mockReset());

describe('SchoolDetailPage', () => {
  it('yüklenirken "Yükleniyor..." gösterir', async () => {
    // Kontrollu deferred: loading state'i hemen kontrol et, sonra resolve et
    let resolve!: (v: unknown) => void;
    const deferred = new Promise((r) => { resolve = r; });
    apiGetMock.mockReturnValue(deferred);

    renderWithProviders(<SchoolDetailPage />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();

    // Cleanup için promise'i resolve et, yoksa sonraki beforeEach kilitleniyor
    resolve({ data: { data: null } });
    await waitFor(() => expect(screen.queryByText('Yükleniyor...')).not.toBeInTheDocument());
  });

  it('okul bulunamazsa "Okul bulunamadı" gösterir', async () => {
    apiGetMock.mockResolvedValue({ data: { data: null } });
    renderWithProviders(<SchoolDetailPage />);

    expect(await screen.findByText('Okul bulunamadı')).toBeInTheDocument();
  });

  it('okul adı ve şehri render eder', async () => {
    setupMocks();
    renderWithProviders(<SchoolDetailPage />);

    expect(await screen.findByText('Anadolu Lisesi')).toBeInTheDocument();
    expect(screen.getByText('İstanbul')).toBeInTheDocument();
  });

  it('okullara dön linki görünür', async () => {
    setupMocks();
    renderWithProviders(<SchoolDetailPage />);

    await screen.findByText('Anadolu Lisesi');
    expect(screen.getByText('Okullara dön')).toBeInTheDocument();
  });

  it('öğretmenler listesini render eder', async () => {
    setupMocks(makeSchool(), [makeTeacher({ firstName: 'Ahmet', lastName: 'Yılmaz' })]);
    renderWithProviders(<SchoolDetailPage />);

    expect(await screen.findByText('Ahmet Yılmaz')).toBeInTheDocument();
  });

  it('danışmanlar listesini render eder', async () => {
    setupMocks(makeSchool(), [], [makeTeacher({ id: 'u-2', firstName: 'Zeynep', lastName: 'Demir', role: 'Advisor' })]);
    renderWithProviders(<SchoolDetailPage />);

    expect(await screen.findByText('Zeynep Demir')).toBeInTheDocument();
  });

  it('rapor sayfasına link içerir', async () => {
    setupMocks();
    renderWithProviders(<SchoolDetailPage />);

    await screen.findByText('Anadolu Lisesi');
    expect(screen.getByText(/raporları görüntüle/i)).toBeInTheDocument();
  });

  it('pasif okul bilgilerini de render eder', async () => {
    setupMocks(makeSchool({ isActive: false, name: 'Kapalı Okul' }));
    renderWithProviders(<SchoolDetailPage />);

    expect(await screen.findByText('Kapalı Okul')).toBeInTheDocument();
  });
});
