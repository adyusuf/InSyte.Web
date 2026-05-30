import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitForElementToBeRemoved } from '../../test/utils';
import SchedulesPage from '../SchedulesPage';
import type { Schedule, School, Class, Subject } from '../../types';

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
        pageSize: 200,
      },
    },
  };
}

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 'sch-1',
    schoolId: 's-1',
    classId: 'c-1',
    subjectId: 'sub-1',
    teacherUserId: 'u-1',
    dayOfWeek: 'Monday',
    startTime: '08:00:00',
    endTime: '08:45:00',
    room: 'A-101',
    isActive: true,
    createdAt: '2025-04-01T00:00:00Z',
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

function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'sub-1',
    schoolId: 's-1',
    name: 'Matematik',
    branch: 'Sayısal',
    level: 'Ortaokul',
    weeklyHours: 4,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function setupMocks(
  schedules: Schedule[] = [],
  schools: School[] = [],
  classes: Class[] = [],
  subjects: Subject[] = [],
) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve(pagedResponse(schools));
    if (url === '/classes') return Promise.resolve(pagedResponse(classes));
    if (url === '/subjects') return Promise.resolve(pagedResponse(subjects));
    if (url === '/schedules') return Promise.resolve(pagedResponse(schedules));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
});

describe('SchedulesPage', () => {
  it('filtre seçilmeden /schedules çağrısı yapar', async () => {
    setupMocks([]);
    renderWithProviders(<SchedulesPage />);

    // Grid yüklendikten sonra kontrol et
    await screen.findByText('Saat');

    const schedulesCall = apiGetMock.mock.calls.find((call) => call[0] === '/schedules');
    expect(schedulesCall).toBeDefined();
    expect(schedulesCall![1]).toEqual({
      params: {
        schoolId: undefined,
        classId: undefined,
        pageSize: 200,
      },
    });
  });

  it('program boşken grid render olur ve saat sütunu görünür', async () => {
    setupMocks([]);
    renderWithProviders(<SchedulesPage />);

    // "Saat" başlık hücresi tablo başlığında görünmeli
    const saatHeader = await screen.findByText('Saat');
    expect(saatHeader).toBeInTheDocument();

    // Gün başlıkları görünmeli
    expect(screen.getByText('Pazartesi')).toBeInTheDocument();
    expect(screen.getByText('Salı')).toBeInTheDocument();
    expect(screen.getByText('Çarşamba')).toBeInTheDocument();
    expect(screen.getByText('Perşembe')).toBeInTheDocument();
    expect(screen.getByText('Cuma')).toBeInTheDocument();

    // İlk saat dilimi görünmeli
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('/schools endpointini çağırır', async () => {
    const school = makeSchool({ id: 's-5', name: 'İnönü İlkokulu' });
    setupMocks([], [school]);
    renderWithProviders(<SchedulesPage />);

    await screen.findByText('Saat');

    const schoolsCall = apiGetMock.mock.calls.find((call) => call[0] === '/schools');
    expect(schoolsCall).toBeDefined();

    // Okul seçici dropdown'ında okul adı görünmeli
    expect(screen.getAllByText('İnönü İlkokulu').length).toBeGreaterThan(0);
  });

  it('ders olan hücrede ders adını gösterir', async () => {
    const subject = makeSubject({ id: 'sub-42', name: 'Fizik' });
    const schedule = makeSchedule({
      id: 'sch-99',
      subjectId: 'sub-42',
      dayOfWeek: 'Monday',
      startTime: '08:00:00',
      endTime: '08:45:00',
    });
    setupMocks([schedule], [], [], [subject]);
    renderWithProviders(<SchedulesPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    // Ders adı hücrede görünmeli
    expect(await screen.findByText('Fizik')).toBeInTheDocument();
  });
});
