import { test, expect, type Page } from "@playwright/test";

// Backend mock'u — tüm /api/v1 çağrılarını fixture'larla karşılar (DB/AI gerekmez).
const user = { id: "u1", email: "admin@insyte.com", firstName: "Admin", lastName: "User", role: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" };
const video = {
  id: "v1", title: "Matematik Dersi", originalFileName: "mat.mp4", fileSize: 1048576,
  schoolId: "s1", schoolName: "Atatürk İlkokulu", teacherUserId: "t1", teacherName: "Ayşe Kaya",
  subject: "Matematik", status: "Evaluated", createdAt: "2025-03-01T00:00:00Z", evaluationCount: 1,
  streamUid: null, thumbnailUrl: null, playbackUrl: null,
};
const evaluation = {
  id: "e1", videoId: "v1", videoTitle: "Matematik Dersi", criteriaId: "c1", criteriaName: "Genel Ders",
  aiModelId: "m1", aiModelName: "Gemini 2.5 Flash", result: JSON.stringify({ genelPuan: 85, sorular: [{ soruId: "q1", puan: 8, yorum: "İyi" }] }),
  tokenUsageInput: 100, tokenUsageOutput: 50, status: "Completed", stage: "Completed", attempt: 1, createdAt: "2025-03-02T00:00:00Z",
};

function ok(body: unknown) {
  return { status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: body }) };
}

async function mockApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = req.method();

    if (path === "/auth/login" && method === "POST") return route.fulfill(ok({ accessToken: "tok", refreshToken: "rtok", user }));
    if (path === "/auth/me") return route.fulfill(ok(user));
    if (path === "/videos" && method === "GET") return route.fulfill(ok({ items: [video], totalCount: 1, page: 1, pageSize: 100 }));
    if (path === "/videos/v1") return route.fulfill(ok(video));
    if (path === "/evaluations" && method === "GET") return route.fulfill(ok({ items: [evaluation], totalCount: 1, page: 1, pageSize: 100 }));
    if (path === "/criteria/c1/questions") return route.fulfill(ok([{ id: "q1", question: "Hedefler açık mı?" }]));
    if (path === "/criteria") return route.fulfill(ok({ items: [], totalCount: 0, page: 1, pageSize: 100 }));
    if (path === "/ai-providers") return route.fulfill(ok([]));
    if (path === "/comparisons" && method === "POST") return route.fulfill(ok({ id: "cmp1" }));
    if (path === "/comparisons" && method === "GET") return route.fulfill(ok([]));
    if (path === "/comparisons/cmp1") return route.fulfill(ok({ id: "cmp1", videoId: "v1", title: "Genel Ders", evaluationIds: ["e1"], createdAt: "2025-03-03T00:00:00Z", reportId: null, reportTitle: null, reportStatus: null, reportContentJson: null }));

    return route.fulfill(ok({ items: [], totalCount: 0, page: 1, pageSize: 100 })); // varsayılan
  });
}

test("giriş → videolar hiyerarşisi → kriterden Rapor Hazırla → matris", async ({ page }) => {
  await mockApi(page);

  // 1) Giriş
  await page.goto("/login");
  await page.getByLabel(/e-?posta/i).or(page.locator('input[type="email"]')).first().fill("admin@insyte.com");
  await page.locator('input[type="password"]').fill("Admin123!");
  await page.getByRole("button", { name: /giriş|giris|login/i }).click();

  // 2) Videolar — okul akordiyonu
  await page.goto("/videos");
  const okul = page.getByText("Atatürk İlkokulu");
  await expect(okul).toBeVisible();
  await expect(page.getByText("Ayşe Kaya")).toHaveCount(0); // kapalı
  await okul.click();

  // 3) Öğretmen → video
  const ogretmen = page.getByText("Ayşe Kaya");
  await expect(ogretmen).toBeVisible();
  await ogretmen.click();
  const videoLink = page.getByRole("link", { name: /Matematik Dersi/ });
  await expect(videoLink).toBeVisible();
  await videoLink.click();

  // 4) Video detay — kriter grubu + Rapor Hazırla
  await expect(page.getByRole("heading", { name: "Matematik Dersi" })).toBeVisible();
  await expect(page.getByText(/Genel Ders/).first()).toBeVisible();
  const raporBtn = page.getByRole("button", { name: "Rapor Hazırla" });
  await expect(raporBtn).toBeVisible();
  await raporBtn.click();

  // 5) Rapor hazırlama — matris (model sütunu)
  await expect(page.getByRole("heading", { name: "Rapor Hazırla" })).toBeVisible();
  await expect(page.getByText("Gemini 2.5 Flash").first()).toBeVisible();
  await expect(page.getByText("Genel Puan").first()).toBeVisible();
});
