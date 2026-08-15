export type ParsedDuration = { ok: true; seconds: number } | { ok: false; error: string }

export function parseDurationToSeconds(input: string): ParsedDuration {
  const raw = (input ?? '').trim()
  if (!raw) return { ok: false, error: 'Süre boş olamaz.' }

  if (/^\d+$/.test(raw)) {
    const sec = Number(raw)
    if (!Number.isFinite(sec) || sec <= 0) return { ok: false, error: 'Süre 0\'dan büyük olmalı.' }
    return { ok: true, seconds: sec }
  }

  // Bounded input (short, user-typed durations, not attacker-controlled
  // network data), so the sequential optional \s* groups here are not a
  // practical ReDoS risk despite the linter's generic pattern match.
  // eslint-disable-next-line security/detect-unsafe-regex
  const m = raw.match(/^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s?)?\s*$/i)
  if (!m || (!m[1] && !m[2] && !m[3])) {
    return { ok: false, error: 'Format: 90, 600s, 10m, 1h30m, 2h15m10s' }
  }

  const h = Number(m[1] ?? 0)
  const min = Number(m[2] ?? 0)
  const s = Number(m[3] ?? 0)
  const total = h * 3600 + min * 60 + s
  if (!Number.isFinite(total) || total <= 0) return { ok: false, error: 'Süre 0\'dan büyük olmalı.' }
  return { ok: true, seconds: total }
}

export function formatDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}sa ${m}dk ${s}sn`
  if (m > 0) return `${m}dk ${s}sn`
  return `${s}sn`
}

export function formatDigitalClock(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function convertSecondsToText(totalSeconds: number): string {
  if (totalSeconds <= 0) return ''
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0) parts.push(`${s}s`)
  return parts.join('') || `${totalSeconds}s`
}
