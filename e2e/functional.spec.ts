import { expect, test } from '@playwright/test'

// End-to-end functional flow against the built web-preview bundle. In this
// mode window.sureliKapatma is undefined (as in any browser tab), so App.tsx
// falls back to its in-memory mock API — no real OS shutdown is ever triggered.
test.describe('Functional QA: shutdown scheduling flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads with the idle state and the web-preview banner', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Kapatika' })).toBeVisible()
    await expect(page.getByText(/Web Önizleme Modu/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Kapatmayı Başlat/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: /İptal Et/ }).first()).toBeDisabled()
  })

  test('selecting a preset updates the displayed duration', async ({ page }) => {
    await page.getByText('1 saat', { exact: true }).click()
    await expect(page.getByText(/1sa 0dk 0sn/)).toBeVisible()
  })

  test('scheduling and cancelling drives the full state machine', async ({ page }) => {
    await page.getByText('15 dk', { exact: true }).click()
    await page.getByRole('button', { name: /Kapatmayı Başlat/ }).click()

    await expect(page.getByText(/Kapatma kuruldu/)).toBeVisible()
    const activeChip = page.getByText(/Windows Kapanma Zamanlandı|Ön Bekleme Modu Aktif/)
    await expect(activeChip).toBeVisible()

    await page.getByRole('button', { name: /İptal Et/ }).first().click()

    await expect(page.getByText('Zamanlanmış kapatma başarıyla iptal edildi.')).toBeVisible()
    await expect(activeChip).not.toBeVisible()
    await expect(page.getByRole('button', { name: /İptal Et/ }).first()).toBeDisabled()
  })

  test('manual duration entry rejects unparsable input', async ({ page }) => {
    const input = page.getByLabel(/Örnek: 90, 600s, 10m, 1h30m/)
    await input.fill('garbage')
    await expect(page.getByRole('button', { name: /^Uygula$/ })).toBeDisabled()
  })

  test('manual duration entry accepts a compact format and schedules it', async ({ page }) => {
    const input = page.getByLabel(/Örnek: 90, 600s, 10m, 1h30m/)
    await input.fill('90s')
    await page.getByRole('button', { name: /^Uygula$/ }).click()
    await expect(page.getByText('Kapatma kuruldu: 1dk 30sn sonra bilgisayar kapanacak.')).toBeVisible()
  })

  test('"Yenile" pulls the latest raw status text', async ({ page }) => {
    await page.getByRole('button', { name: /Yenile/ }).click()
    await expect(page.getByText(/Zamanlayıcı pasif/)).toBeVisible()
  })
})
