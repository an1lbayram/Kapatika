import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DurationWheel } from '../../src/components/DurationWheel'

describe('DurationWheel', () => {
  it('renders the currently selected hour and minute prominently', () => {
    render(<DurationWheel value={{ hours: 3, minutes: 45 }} onChange={() => {}} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('pads minutes to two digits while hours stay unpadded', () => {
    // Hours 0-23 render unpadded ("5"), minutes 0-59 always render as two
    // digits ("07"), so single-digit minutes never collide with hour labels.
    render(<DurationWheel value={{ hours: 5, minutes: 7 }} onChange={() => {}} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('07')).toBeInTheDocument()
  })

  it('calls onChange with the new hour when an hour cell is clicked, preserving minutes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DurationWheel value={{ hours: 0, minutes: 45 }} onChange={onChange} />)

    await user.click(screen.getByText('5'))

    expect(onChange).toHaveBeenCalledWith({ hours: 5, minutes: 45 })
  })

  it('calls onChange with the new minute when a minute cell is clicked, preserving hours', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DurationWheel value={{ hours: 2, minutes: 0 }} onChange={onChange} />)

    await user.click(screen.getByText('30'))

    expect(onChange).toHaveBeenCalledWith({ hours: 2, minutes: 30 })
  })

  it('respects a custom maxHours bound', () => {
    // Use a single-digit probe: unpadded hour "5" can't collide with the
    // minute column, which always renders two-digit strings ("05").
    render(<DurationWheel value={{ hours: 0, minutes: 0 }} onChange={() => {}} maxHours={2} />)
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })
})
