import { defineConfig, devices } from '@playwright/test'

// A non-default port: 4173 is Vite's hardcoded preview default, so any other
// local project also running `vite preview` collides with it (observed:
// this port was already bound by unrelated sibling projects on this machine,
// causing the e2e suite to silently hit the wrong app via reuseExistingServer).
const PORT = 43173
const baseURL = `http://localhost:${PORT}`

// E2E runs against the built web-preview bundle (`vite build` + `vite preview`),
// which uses App.tsx's in-browser mock API (window.sureliKapatma is undefined
// outside Electron) — the real `shutdown` OS command is never invoked here.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Each worker launches a full browser + renders MUI-heavy pages; capped low
  // to avoid CPU contention/flaky timeouts on modest machines and CI runners.
  workers: 2,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npm run build:web && npm run preview`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
