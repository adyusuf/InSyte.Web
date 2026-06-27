import { defineConfig, devices } from "@playwright/test";

// E2E: tarayıcıda gerçek UI akışı. Backend mock'lanır (page.route) — DB/AI gerekmez.
// Vite dev sunucusu otomatik başlatılır (zaten çalışıyorsa yeniden kullanılır).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5174",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
