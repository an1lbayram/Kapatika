import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

// Component-level tests exercise App's own rendering/validation logic against
// the built-in web-preview mock API (window.sureliKapatma is undefined in jsdom,
// same as a browser tab), without asserting on IPC call sequencing — that
// belongs to the integration suite.
describe('App (component)', () => {
  afterEach(() => {
    // @ts-expect-error - cleanup any test-installed bridge between tests
    delete window.sureliKapatma
  })

  it('shows the web-preview banner when no electron bridge is present', () => {
    render(<App />)
    expect(screen.getByText(/Web Önizleme Modu/)).toBeInTheDocument()
  })

  it('renders the default 45 minute selection and enabled start button', () => {
    render(<App />)
    expect(screen.getByText(/45dk/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Kapatmayı Başlat/ })).toBeEnabled()
  })

  it('disables the start button when a valid sub-minute duration rounds the wheel to zero', async () => {
    // The wheel only tracks hour/minute granularity, so a valid "30s" input
    // parses fine (Uygula stays enabled) but rounds the wheel to 0h/0m,
    // disabling the wheel-driven start button — a real UX edge case.
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText(/Örnek: 90, 600s, 10m, 1h30m/)
    await user.clear(input)
    await user.type(input, '30s')
    expect(input).toBeValid()
    expect(screen.getByRole('button', { name: /Kapatmayı Başlat/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Uygula$/ })).toBeEnabled()
  })

  it('marks the manual text field invalid on unparsable input and disables Uygula', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText(/Örnek: 90, 600s, 10m, 1h30m/)
    await user.clear(input)
    await user.type(input, 'not-a-duration')
    expect(input).toBeInvalid()
    expect(screen.getByRole('button', { name: /^Uygula$/ })).toBeDisabled()
  })

  it('selects a preset chip and updates the displayed duration', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('1 saat'))
    expect(screen.getByText(/1sa 0dk 0sn/)).toBeInTheDocument()
  })

  it('cancel button is disabled while idle', () => {
    render(<App />)
    const cancelButtons = screen.getAllByRole('button', { name: /İptal Et/ })
    expect(cancelButtons[0]).toBeDisabled()
  })
})

describe('App (electron bridge present)', () => {
  beforeEach(() => {
    window.sureliKapatma = {
      schedule: async () => ({ ok: true, value: { totalSeconds: 60, preWaitSeconds: 0, shutdownTSeconds: 60 } }),
      cancel: async () => ({ ok: true, value: true as const }),
      status: async () => ({ ok: true, value: { state: { kind: 'idle' }, raw: 'idle' } }),
      onState: () => () => {},
    }
  })

  afterEach(() => {
    // @ts-expect-error - test-only bridge cleanup
    delete window.sureliKapatma
  })

  it('hides the web-preview banner when the electron bridge is present', () => {
    render(<App />)
    expect(screen.queryByText(/Web Önizleme Modu/)).not.toBeInTheDocument()
  })
})
