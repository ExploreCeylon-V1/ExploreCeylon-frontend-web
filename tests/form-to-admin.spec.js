import { test, expect } from "@playwright/test";

test("contact form -> backend and admin verification", async ({ request }) => {
  const API_BASE = process.env.API_BASE || "http://localhost:8080";

  const payload = {
    name: `E2E Test ${Date.now()}`,
    email: `e2e+${Date.now()}@example.com`,
    subject: "E2E contact test",
    message: `This is an automated end-to-end test message at ${new Date().toISOString()}`,
  };

  // 1) Submit the public contact form endpoint
  const post = await request.post(`${API_BASE}/api/v1/contact`, {
    data: payload,
  });
  expect(
    post.ok(),
    `POST /api/v1/contact failed: ${post.status()}`,
  ).toBeTruthy();
  const posted = await post.json();
  expect(posted).toBeTruthy();

  // 2) If ADMIN_TOKEN is provided, verify message appears via admin API
  const adminToken = process.env.ADMIN_TOKEN;
  test.skip(
    !adminToken,
    "ADMIN_TOKEN not provided — skipping admin verification",
  );

  const adminRes = await request.get(`${API_BASE}/api/v1/contact/admin`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(
    adminRes.ok(),
    `GET /api/v1/contact/admin failed: ${adminRes.status()}`,
  ).toBeTruthy();
  const list = await adminRes.json();
  const found =
    Array.isArray(list) &&
    list.some(
      (m) =>
        m.email === payload.email &&
        (m.message || "").includes("automated end-to-end"),
    );
  expect(found).toBeTruthy();
});
