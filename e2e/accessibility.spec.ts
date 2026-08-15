import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Full-browser axe scans catch what jsdom can't (e.g. color-contrast).
// Component-level axe checks for individual states live in tests/accessibility.
test.describe('Accessibility (axe-core, real browser)', () => {
  test('idle page has no WCAG 2.0/2.1 A/AA violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })

  test('active countdown state has no WCAG 2.0/2.1 A/AA violations', async ({ page }) => {
    await page.goto('/')
    await page.getByText('15 dk', { exact: true }).click()
    await page.getByRole('button', { name: /Kapatmayı Başlat/ }).click()
    await expect(page.getByText(/Windows Kapanma Zamanlandı|Ön Bekleme Modu Aktif/)).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })

  test('page declares a Turkish document language for assistive tech', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
  })
})
