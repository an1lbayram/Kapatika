import { describe, expect, it } from 'vitest'
import {
  convertSecondsToText,
  formatDigitalClock,
  formatDuration,
  parseDurationToSeconds,
} from '../../src/lib/duration'

describe('parseDurationToSeconds', () => {
  it('rejects empty input', () => {
    const r = parseDurationToSeconds('')
    expect(r.ok).toBe(false)
  })

  it('rejects whitespace-only input', () => {
    const r = parseDurationToSeconds('   ')
    expect(r.ok).toBe(false)
  })

  it('parses a bare integer as seconds', () => {
    const r = parseDurationToSeconds('90')
    expect(r).toEqual({ ok: true, seconds: 90 })
  })

  it('rejects zero', () => {
    const r = parseDurationToSeconds('0')
    expect(r.ok).toBe(false)
  })

  it('rejects negative numbers (fails the integer/hms regexes)', () => {
    const r = parseDurationToSeconds('-5')
    expect(r.ok).toBe(false)
  })

  it.each([
    ['600s', 600],
    ['10m', 600],
    ['1h', 3600],
    ['1h30m', 5400],
    ['2h15m10s', 8110],
    ['90s', 90],
  ])('parses "%s" as %i seconds', (input, expected) => {
    const r = parseDurationToSeconds(input)
    expect(r).toEqual({ ok: true, seconds: expected })
  })

  it('is case-insensitive for unit suffixes', () => {
    expect(parseDurationToSeconds('1H30M')).toEqual({ ok: true, seconds: 5400 })
  })

  it('tolerates internal whitespace between components', () => {
    expect(parseDurationToSeconds('1h 30m')).toEqual({ ok: true, seconds: 5400 })
  })

  it('rejects garbage input', () => {
    const r = parseDurationToSeconds('abc')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/Format/)
  })

  it('rejects a duration that parses to zero total (e.g. "0h0m")', () => {
    const r = parseDurationToSeconds('0h0m')
    expect(r.ok).toBe(false)
  })
})

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45sn')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2dk 5sn')
  })

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3725)).toBe('1sa 2dk 5sn')
  })

  it('clamps negative input to zero', () => {
    expect(formatDuration(-10)).toBe('0sn')
  })

  it('floors fractional seconds', () => {
    expect(formatDuration(59.9)).toBe('59sn')
  })
})

describe('formatDigitalClock', () => {
  it('zero-pads hh:mm:ss', () => {
    expect(formatDigitalClock(5)).toBe('00:00:05')
  })

  it('formats a full hh:mm:ss value', () => {
    expect(formatDigitalClock(3725)).toBe('01:02:05')
  })

  it('clamps negative input to 00:00:00', () => {
    expect(formatDigitalClock(-100)).toBe('00:00:00')
  })
})

describe('convertSecondsToText', () => {
  it('returns empty string for zero/negative input', () => {
    expect(convertSecondsToText(0)).toBe('')
    expect(convertSecondsToText(-5)).toBe('')
  })

  it('emits compact h/m/s tokens, omitting zero components', () => {
    expect(convertSecondsToText(5400)).toBe('1h30m')
    expect(convertSecondsToText(60)).toBe('1m')
    expect(convertSecondsToText(45)).toBe('45s')
  })

  it('round-trips through parseDurationToSeconds', () => {
    const seconds = 8110
    const text = convertSecondsToText(seconds)
    const parsed = parseDurationToSeconds(text)
    expect(parsed).toEqual({ ok: true, seconds })
  })
})
