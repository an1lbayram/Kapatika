import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import App from '../../src/App'
import { DurationWheel } from '../../src/components/DurationWheel'

// Component-level a11y checks run on every commit against static/interacted
// DOM snapshots in jsdom (fast). Full-page, real-browser axe scans (incl.
// color-contrast, which jsdom can't compute) live in e2e/accessibility.spec.ts.
describe('Accessibility (vitest-axe)', () => {
  afterEach(() => {
    // @ts-expect-error - test-only bridge cleanup
    delete window.sureliKapatma
  })

  it('idle App has no detectable axe violations', async () => {
    const { container } = render(<App />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('App with an active countdown card has no detectable axe violations', async () => {
    window.sureliKapatma = {
      schedule: async (totalSeconds: number) => ({
        ok: true,
        value: { totalSeconds, preWaitSeconds: 0, shutdownTSeconds: totalSeconds },
      }),
      cancel: async () => ({ ok: true, value: true as const }),
      status: async () => ({
        ok: true,
        value: {
          state: { kind: 'scheduled', shutdownTSeconds: 3600, targetEpochMs: Date.now() + 3600_000, totalSeconds: 3600 },
          raw: 'raw',
        },
      }),
      onState: () => () => {},
    }
    const user = userEvent.setup()
    const { container, findByText, getByRole } = render(<App />)
    await user.click(getByRole('button', { name: /Kapatmayı Başlat/ }))
    await findByText('Windows Kapanma Zamanlandı')

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('DurationWheel in isolation has no detectable axe violations', async () => {
    const { container } = render(<DurationWheel value={{ hours: 1, minutes: 30 }} onChange={() => {}} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
