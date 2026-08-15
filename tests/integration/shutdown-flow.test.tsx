import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import type { ApiResult, ShutdownPlan, ShutdownState } from '../../electron/shared'

// Mirrors the state-machine in electron/main.ts (600s pre-wait threshold)
// without touching a real process, so the full App <-> preload-API contract
// can be exercised end-to-end inside jsdom.
function createFakeElectronApi() {
  let state: ShutdownState = { kind: 'idle' }

  return {
    __getState: () => state,
    schedule: vi.fn(async (totalSeconds: number): Promise<ApiResult<ShutdownPlan>> => {
      if (totalSeconds > 600) {
        state = { kind: 'prewait', endsAtEpochMs: Date.now() + (totalSeconds - 600) * 1000, totalSeconds }
        return { ok: true, value: { totalSeconds, preWaitSeconds: totalSeconds - 600, shutdownTSeconds: 600 } }
      }
      state = { kind: 'scheduled', shutdownTSeconds: totalSeconds, targetEpochMs: Date.now() + totalSeconds * 1000, totalSeconds }
      return { ok: true, value: { totalSeconds, preWaitSeconds: 0, shutdownTSeconds: totalSeconds } }
    }),
    cancel: vi.fn(async (): Promise<ApiResult<true>> => {
      state = { kind: 'idle' }
      return { ok: true, value: true }
    }),
    status: vi.fn(async () => ({ ok: true as const, value: { state, raw: `raw:${state.kind}` } })),
    onState: vi.fn(() => () => {}),
  }
}

describe('Shutdown scheduling flow (integration)', () => {
  afterEach(() => {
    // @ts-expect-error - test-only bridge cleanup
    delete window.sureliKapatma
  })

  it('schedules a short duration directly (no pre-wait) and reflects the scheduled state', async () => {
    const api = createFakeElectronApi()
    window.sureliKapatma = api
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText(/Örnek: 90, 600s, 10m, 1h30m/)
    await user.clear(input)
    await user.type(input, '300s')
    await user.click(screen.getByRole('button', { name: /^Uygula$/ }))

    expect(api.schedule).toHaveBeenCalledWith(300)
    await screen.findByText(/Kapatma kuruldu: 5dk 0sn sonra bilgisayar kapanacak\./)
    expect(await screen.findByText('Windows Kapanma Zamanlandı')).toBeInTheDocument()
    expect(api.status).toHaveBeenCalled()
  })

  it('schedules a long duration through the pre-wait path and surfaces it in the UI', async () => {
    const api = createFakeElectronApi()
    window.sureliKapatma = api
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('2 saat'))
    await user.click(screen.getByRole('button', { name: /Kapatmayı Başlat/ }))

    expect(api.schedule).toHaveBeenCalledWith(7200)
    await screen.findByText(/ön bekleme yapılır/)
    expect(await screen.findByText('Ön Bekleme Modu Aktif')).toBeInTheDocument()
  })

  it('cancels an active schedule and returns the UI to idle', async () => {
    const api = createFakeElectronApi()
    window.sureliKapatma = api
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('1 saat'))
    await user.click(screen.getByRole('button', { name: /Kapatmayı Başlat/ }))
    await screen.findByText('Ön Bekleme Modu Aktif')

    const cancelButtons = screen.getAllByRole('button', { name: /İptal Et/ })
    await user.click(cancelButtons[0])

    expect(api.cancel).toHaveBeenCalled()
    await screen.findByText('Zamanlanmış kapatma başarıyla iptal edildi.')
    await waitFor(() => expect(screen.queryByText('Ön Bekleme Modu Aktif')).not.toBeInTheDocument())
  })

  it('surfaces a schedule failure as an error alert without changing state', async () => {
    const api = createFakeElectronApi()
    api.schedule.mockResolvedValueOnce({ ok: false, error: 'Bu uygulama Windows için tasarlandı.' })
    window.sureliKapatma = api
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Kapatmayı Başlat/ }))

    expect(await screen.findByText('Bu uygulama Windows için tasarlandı.')).toBeInTheDocument()
    expect(screen.queryByText('Windows Kapanma Zamanlandı')).not.toBeInTheDocument()
    expect(screen.queryByText('Ön Bekleme Modu Aktif')).not.toBeInTheDocument()
  })

  it('surfaces a cancel failure as an error alert', async () => {
    const api = createFakeElectronApi()
    api.cancel.mockResolvedValueOnce({ ok: false, error: 'İptal başarısız.' })
    window.sureliKapatma = api
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('1 saat'))
    await user.click(screen.getByRole('button', { name: /Kapatmayı Başlat/ }))
    await screen.findByText('Ön Bekleme Modu Aktif')

    const cancelButtons = screen.getAllByRole('button', { name: /İptal Et/ })
    await user.click(cancelButtons[0])

    expect(await screen.findByText('İptal başarısız.')).toBeInTheDocument()
    // State is unchanged because the fake only flips to idle on success.
    expect(screen.getByText('Ön Bekleme Modu Aktif')).toBeInTheDocument()
  })
})

describe('Status refresh (integration)', () => {
  let api: ReturnType<typeof createFakeElectronApi>

  beforeEach(() => {
    api = createFakeElectronApi()
    window.sureliKapatma = api
  })

  afterEach(() => {
    // @ts-expect-error - test-only bridge cleanup
    delete window.sureliKapatma
  })

  it('pulls raw status text from the API when "Yenile" is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Yenile/ }))

    expect(api.status).toHaveBeenCalled()
    await screen.findByText('raw:idle')
  })
})
