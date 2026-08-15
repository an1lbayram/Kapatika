import { expect, test } from '@playwright/test'

// Baselines are tracked for Chromium only, to avoid maintaining per-engine
// font-rendering variance. Cross-browser functional coverage still runs on
// firefox/webkit via the other e2e specs (see playwright.config.ts projects).
test.describe('Visual regression', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Screenshot baselines are Chromium-only.')

  test('idle state matches baseline', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Kapatika' })).toBeVisible()
    await expect(page).toHaveScreenshot('idle.png', { maxDiffPixelRatio: 0.02 })
  })

  test('active countdown state matches baseline', async ({ page }) => {
    await page.goto('/')
    await page.getByText('15 dk', { exact: true }).click()
    await page.getByRole('button', { name: /Kapatmayı Başlat/ }).click()
    await expect(page.getByText(/Windows Kapanma Zamanlandı|Ön Bekleme Modu Aktif/)).toBeVisible()

    await expect(page).toHaveScreenshot('active.png', {
      maxDiffPixelRatio: 0.02,
      // The clock ticks every second and the progress bar advances with it -
      // mask both so the live countdown doesn't produce false diffs.
      mask: [page.getByTestId('countdown-clock'), page.getByTestId('countdown-progress')],
    })
  })
})
