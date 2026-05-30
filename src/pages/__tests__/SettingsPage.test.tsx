import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../../test/utils';
import SettingsPage from '../SettingsPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

describe('SettingsPage', () => {
  it('üç tanım kartını render eder', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('AI Tanımaları')).toBeInTheDocument();
    expect(screen.getByText('Değerlendirme Kriterleri')).toBeInTheDocument();
    expect(screen.getByText('Değerlendirme Soruları')).toBeInTheDocument();
  });

  it('kart açıklamalarını gösterir', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText(/AI sağlayıcılarını/i)).toBeInTheDocument();
    expect(screen.getByText(/Ders değerlendirme/i)).toBeInTheDocument();
    expect(screen.getByText(/Kriterlere ait sorular/i)).toBeInTheDocument();
  });

  it('"AI Tanımaları" kartına tıklanınca /settings/ai yönlendirir', async () => {
    const { getByText } = renderWithProviders(<SettingsPage />);
    getByText('AI Tanımaları').closest('button')!.click();

    expect(navigateMock).toHaveBeenCalledWith('/settings/ai');
  });

  it('"Değerlendirme Kriterleri" kartına tıklanınca /settings/criteria yönlendirir', () => {
    renderWithProviders(<SettingsPage />);
    screen.getByText('Değerlendirme Kriterleri').closest('button')!.click();

    expect(navigateMock).toHaveBeenCalledWith('/settings/criteria');
  });

  it('"Değerlendirme Soruları" kartına tıklanınca /settings/questions yönlendirir', () => {
    renderWithProviders(<SettingsPage />);
    screen.getByText('Değerlendirme Soruları').closest('button')!.click();

    expect(navigateMock).toHaveBeenCalledWith('/settings/questions');
  });
});
