import { expect, test } from '@playwright/test'

test.describe('SEO Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('has a descriptive <title>', async ({ page }) => {
    await expect(page).toHaveTitle('Kapatika - Windows Süreli Otomatik Kapatma Uygulaması')
  })

  test('has a non-empty meta description', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(20)
  })

  test('declares a document language', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
  })

  test('has a viewport meta tag for mobile rendering', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
  })

  test('has exactly one <h1> that matches the visible brand name', async ({ page }) => {
    const h1s = page.locator('h1')
    await expect(h1s).toHaveCount(1)
    await expect(h1s.first()).toHaveText('Kapatika')
  })

  test('has a favicon link', async ({ page }) => {
    const iconHref = await page.locator('link[rel="icon"]').getAttribute('href')
    expect(iconHref).toBeTruthy()
  })

  test('has a theme-color meta tag', async ({ page }) => {
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content')
    expect(themeColor).toBeTruthy()
  })
})
