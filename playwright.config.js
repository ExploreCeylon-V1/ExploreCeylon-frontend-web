// Playwright configuration for e2e tests (ESM)
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "tests",
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
};

export default config;
