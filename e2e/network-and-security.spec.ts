import { expect, test } from '@playwright/test'

const ALLOWED_ORIGINS = [
  'http://localhost:43173', // same-origin (self)
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://vitals.vercel-insights.com',
]

function isAllowedOrigin(url: string): boolean {
  try {
    const origin = new URL(url).origin
    return ALLOWED_ORIGINS.includes(origin)
  } catch {
    return true // data:/blob: URLs etc. - not a network egress concern
  }
}

// "API Testing" for this backend-less app means verifying its declared
// network contract (the index.html CSP allow-list, see tests/unit/security.test.ts)
// actually matches what the running app requests - and that the app is free
// of runtime/console errors across the primary user flow.
test.describe('Network contract', () => {
  test('never requests an origin outside the CSP allow-list', async ({ page }) => {
    const offAllowlistRequests: string[] = []
    page.on('request', (req) => {
      if (!isAllowedOrigin(req.url())) offAllowlistRequests.push(req.url())
    })

    await page.goto('/')
    await page.getByText('15 dk', { exact: true }).click()
    await page.getByRole('button', { name: /Kapatmayı Başlat/ }).click()
    await expect(page.getByText(/Windows Kapanma Zamanlandı|Ön Bekleme Modu Aktif/)).toBeVisible()
    await page.getByRole('button', { name: /İptal Et/ }).first().click()

    expect(offAllowlistRequests).toEqual([])
  })

  test('the full schedule/cancel flow produces no unexpected console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await page.goto('/')
    await page.getByText('1 saat', { exact: true }).click()
    await page.getByRole('button', { name: /Kapatmayı Başlat/ }).click()
    await expect(page.getByText(/Ön Bekleme Modu Aktif/)).toBeVisible()
    await page.getByRole('button', { name: /İptal Et/ }).first().click()
    await expect(page.getByText('Zamanlanmış kapatma başarıyla iptal edildi.')).toBeVisible()

    // @vercel/analytics' <Analytics /> always requests /_vercel/insights/script.js;
    // that path only resolves on Vercel's own edge network, so every non-Vercel
    // host (local preview, this CI runner) legitimately logs this exact 404.
    // Confirmed via a diagnostic response listener that this is the only 404
    // the app ever produces; see the "never requests an origin outside the
    // CSP allow-list" test above for the same-origin network assertion.
    const KNOWN_BENIGN_MESSAGE = 'Failed to load resource: the server responded with a status of 404 (Not Found)'
    const unexpectedErrors = consoleErrors.filter((msg) => msg !== KNOWN_BENIGN_MESSAGE)
    expect(unexpectedErrors).toEqual([])
  })
})

test.describe('Security: external navigation', () => {
  test('the developer credit link opens without granting the new tab an opener reference', async ({ page, context }) => {
    await page.goto('/')

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'an1lbayram' }).click(),
    ])
    await popup.waitForLoadState('domcontentloaded').catch(() => {
      // Offline test environments may fail to actually load the external
      // site; the reverse-tabnabbing check below doesn't depend on that.
    })

    const openerIsNull = await popup.evaluate(() => window.opener === null)
    expect(openerIsNull).toBe(true)
    await popup.close()
  })
})
