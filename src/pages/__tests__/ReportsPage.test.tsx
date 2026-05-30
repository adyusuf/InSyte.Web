import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitForElementToBeRemoved } from '../../test/utils';
import ReportsPage from '../ReportsPage';
import type { Report, School } from '../../types';

const apiGetMock = vi.fn();
const apiPutMock = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    put: (...args: unknown[]) => apiPutMock(...args),
  },
}));

// window.confirm mock
const confirmMock = vi.fn();
Object.defineProperty(window, 'confirm', { value: confirmMock, writable: true });

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

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r-1',
    evaluationId: 'e-1',
    videoTitle: 'Matematik Dersi',
    schoolName: 'Atatürk İlkokulu',
    teacherName: 'Ayşe Kaya',
    pdfPath: undefined,
    approvedByName: undefined,
    approvedAt: undefined,
    status: 'Draft',
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

function setupMocks(reports: Report[], schools: School[] = []) {
  apiGetMock.mockImplementation((url: string) => {
    if (url === '/schools') return Promise.resolve(pagedResponse(schools));
    if (url === '/reports') return Promise.resolve(pagedResponse(reports));
    return Promise.reject(new Error(`Bilinmeyen URL: ${url}`));
  });
}

beforeEach(() => {
  apiGetMock.mockReset();
  apiPutMock.mockReset();
  confirmMock.mockReset();
});

describe('ReportsPage', () => {
  it('/reports çağrısında doğru parametreleri gönderir', async () => {
    setupMocks([]);
    renderWithProviders(<ReportsPage />);

    await screen.findByText('Rapor bulunamadı');

    const reportsCall = apiGetMock.mock.calls.find((call) => call[0] === '/reports');
    expect(reportsCall).toBeDefined();
    expect(reportsCall![1]).toEqual({
      params: {
        schoolId: undefined,
        search: '',
        page: 1,
        pageSize: 20,
      },
    });
  });

  it('rapor listesi boşken "Rapor bulunamadı" gösterir', async () => {
    setupMocks([]);
    renderWithProviders(<ReportsPage />);

    expect(await screen.findByText('Rapor bulunamadı')).toBeInTheDocument();
  });

  it('rapor satırını video başlığı, okul ve öğretmen ile render eder', async () => {
    const report = makeReport({
      id: 'r-55',
      videoTitle: 'Türkçe Edebiyat',
      schoolName: 'Cumhuriyet Lisesi',
      teacherName: 'Hasan Yıldız',
    });
    setupMocks([report]);
    renderWithProviders(<ReportsPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    expect(screen.getByText('Türkçe Edebiyat')).toBeInTheDocument();
    expect(screen.getByText('Cumhuriyet Lisesi')).toBeInTheDocument();
    expect(screen.getByText('Hasan Yıldız')).toBeInTheDocument();
  });

  it('okul filtresi /schools endpointini çağırır ve okulları listeler', async () => {
    const school = makeSchool({ id: 's-88', name: 'Fatih Ortaokulu' });
    setupMocks([], [school]);
    renderWithProviders(<ReportsPage />);

    await screen.findByText('Rapor bulunamadı');

    const schoolsCall = apiGetMock.mock.calls.find((call) => call[0] === '/schools');
    expect(schoolsCall).toBeDefined();

    expect(screen.getAllByText('Fatih Ortaokulu').length).toBeGreaterThan(0);
  });

  it('pdfPath varsa PDF linki gösterir', async () => {
    const report = makeReport({
      id: 'r-10',
      pdfPath: '/rapor/r-10.pdf',
      status: 'Approved',
    });
    setupMocks([report]);
    renderWithProviders(<ReportsPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    const pdfLink = screen.getByRole('link', { name: 'PDF' });
    expect(pdfLink).toBeInTheDocument();
    expect(pdfLink).toHaveAttribute('href', 'http://localhost:5090/api/reports/r-10/pdf');
  });

  it('pdfPath yoksa PDF linki göstermez', async () => {
    const report = makeReport({ id: 'r-20', pdfPath: undefined, status: 'Draft' });
    setupMocks([report]);
    renderWithProviders(<ReportsPage />);

    await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

    expect(screen.queryByRole('link', { name: 'PDF' })).not.toBeInTheDocument();
  });

  describe('Durum rozetleri', () => {
    it('Draft durumu için "Taslak" rozeti gösterir', async () => {
      setupMocks([makeReport({ status: 'Draft' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));
      expect(screen.getByText('Taslak')).toBeInTheDocument();
    });

    it('Approved durumu için "Onaylandı" rozeti gösterir', async () => {
      setupMocks([makeReport({ status: 'Approved' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));
      expect(screen.getByText('Onaylandı')).toBeInTheDocument();
    });

    it('Sent durumu için "Gönderildi" rozeti gösterir', async () => {
      setupMocks([makeReport({ status: 'Sent' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));
      expect(screen.getByText('Gönderildi')).toBeInTheDocument();
    });

    it('Rejected durumu için "Reddedildi" rozeti gösterir', async () => {
      setupMocks([makeReport({ status: 'Rejected' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));
      expect(screen.getByText('Reddedildi')).toBeInTheDocument();
    });
  });

  describe('Aksiyonlar kolonu', () => {
    it('Draft rapor için Onayla ve Reddet butonlarını gösterir', async () => {
      setupMocks([makeReport({ status: 'Draft' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      expect(screen.getByRole('button', { name: 'Onayla' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reddet' })).toBeInTheDocument();
    });

    it('Draft olmayan rapor için aksiyon butonları göstermez', async () => {
      setupMocks([makeReport({ status: 'Approved' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      expect(screen.queryByRole('button', { name: 'Onayla' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reddet' })).not.toBeInTheDocument();
    });

    it('Onayla butonuna tıklayınca onay dialogu açar ve onaylanırsa PUT isteği gönderir', async () => {
      const user = userEvent.setup();
      confirmMock.mockReturnValue(true);
      apiPutMock.mockResolvedValue({ data: {} });
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/schools') return Promise.resolve(pagedResponse([]));
        if (url === '/reports') return Promise.resolve(pagedResponse([makeReport({ id: 'r-approve', status: 'Draft' })]));
        return Promise.reject(new Error('Bilinmeyen URL'));
      });

      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      await user.click(screen.getByRole('button', { name: 'Onayla' }));

      expect(confirmMock).toHaveBeenCalled();
      expect(apiPutMock).toHaveBeenCalledWith('/reports/r-approve/approve');
    });

    it('Onayla dialogunda iptal edilirse PUT isteği göndermez', async () => {
      const user = userEvent.setup();
      confirmMock.mockReturnValue(false);
      setupMocks([makeReport({ id: 'r-cancel', status: 'Draft' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      await user.click(screen.getByRole('button', { name: 'Onayla' }));

      expect(confirmMock).toHaveBeenCalled();
      expect(apiPutMock).not.toHaveBeenCalled();
    });
  });

  describe('Reddet modalı', () => {
    it('Reddet butonuna tıklayınca modal açılır', async () => {
      const user = userEvent.setup();
      setupMocks([makeReport({ status: 'Draft' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      await user.click(screen.getByRole('button', { name: 'Reddet' }));

      expect(screen.getByText('Raporu Reddet')).toBeInTheDocument();
      expect(screen.getByLabelText('Ret Gerekçesi')).toBeInTheDocument();
    });

    it('Boş gerekçe ile gönderilirse hata mesajı gösterir', async () => {
      const user = userEvent.setup();
      setupMocks([makeReport({ status: 'Draft' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      await user.click(screen.getByRole('button', { name: 'Reddet' }));
      // Modal içindeki Reddet butonu (ikinci tane)
      const modalRejectBtns = screen.getAllByRole('button', { name: 'Reddet' });
      await user.click(modalRejectBtns[modalRejectBtns.length - 1]);

      expect(screen.getByText('Ret gerekçesi en az 5 karakter olmalıdır.')).toBeInTheDocument();
      expect(apiPutMock).not.toHaveBeenCalled();
    });

    it('Geçerli gerekçe ile PUT isteği gönderir', async () => {
      const user = userEvent.setup();
      apiPutMock.mockResolvedValue({ data: {} });
      apiGetMock.mockImplementation((url: string) => {
        if (url === '/schools') return Promise.resolve(pagedResponse([]));
        if (url === '/reports') return Promise.resolve(pagedResponse([makeReport({ status: 'Draft' })]));
        return Promise.reject(new Error('Bilinmeyen URL'));
      });

      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      await user.click(screen.getByRole('button', { name: 'Reddet' }));

      const textarea = screen.getByPlaceholderText('Ret nedenini açıklayın...');
      await user.type(textarea, 'Yetersiz içerik kalitesi');

      const modalRejectBtns = screen.getAllByRole('button', { name: 'Reddet' });
      await user.click(modalRejectBtns[modalRejectBtns.length - 1]);

      expect(apiPutMock).toHaveBeenCalledWith('/reports/r-1/reject', { reason: 'Yetersiz içerik kalitesi' });
    });

    it('İptal butonuna tıklayınca modal kapanır', async () => {
      const user = userEvent.setup();
      setupMocks([makeReport({ status: 'Draft' })]);
      renderWithProviders(<ReportsPage />);
      await waitForElementToBeRemoved(() => screen.queryByText('Yükleniyor...'));

      await user.click(screen.getByRole('button', { name: 'Reddet' }));
      expect(screen.getByText('Raporu Reddet')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'İptal' }));
      expect(screen.queryByText('Raporu Reddet')).not.toBeInTheDocument();
    });
  });
});
