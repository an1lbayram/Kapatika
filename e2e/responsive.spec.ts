import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

for (const vp of viewports) {
  test.describe(`Responsive layout @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    test('renders the core controls without horizontal overflow', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByRole('heading', { name: 'Kapatika' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Kapatmayı Başlat/ })).toBeVisible()
      await expect(page.getByLabel(/Örnek: 90, 600s, 10m, 1h30m/)).toBeVisible()

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      )
      expect(hasHorizontalOverflow).toBe(false)
    })

    test('the preset-to-schedule flow works at this breakpoint', async ({ page }) => {
      await page.goto('/')
      await page.getByText('15 dk', { exact: true }).click()
      await page.getByRole('button', { name: /Kapatmayı Başlat/ }).click()
      await expect(page.getByText(/Windows Kapanma Zamanlandı|Ön Bekleme Modu Aktif/)).toBeVisible()
    })
  })
}
