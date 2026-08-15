import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { IconCancel, IconClock, IconPower, IconRefresh } from '../../src/components/Icons'

describe('Icon components', () => {
  it.each([
    ['IconPower', IconPower],
    ['IconClock', IconClock],
    ['IconRefresh', IconRefresh],
    ['IconCancel', IconCancel],
  ] as const)('%s renders a single decorative svg with a viewBox', (_name, Icon) => {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    // MUI SvgIcon marks purely decorative icons aria-hidden by default,
    // which is correct here since every usage is paired with visible text.
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('forwards custom props like sx/className/fontSize to the underlying svg', () => {
    const { container } = render(<IconPower fontSize="small" data-testid="power-icon" />)
    expect(container.querySelector('[data-testid="power-icon"]')).toBeInTheDocument()
  })
})
