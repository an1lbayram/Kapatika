import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApiResult, ShutdownPlan, ShutdownState } from '../electron/shared'
import { DurationWheel } from './components/DurationWheel'
import { IconCancel, IconClock, IconPower, IconRefresh } from './components/Icons'

type ParsedDuration = { ok: true; seconds: number } | { ok: false; error: string }

function parseDurationToSeconds(input: string): ParsedDuration {
  const raw = (input ?? '').trim()
  if (!raw) return { ok: false, error: 'Süre boş olamaz.' }

  if (/^\d+$/.test(raw)) {
    const sec = Number(raw)
    if (!Number.isFinite(sec) || sec <= 0) return { ok: false, error: 'Süre 0\'dan büyük olmalı.' }
    return { ok: true, seconds: sec }
  }

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

function formatDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}sa ${m}dk ${s}sn`
  if (m > 0) return `${m}dk ${s}sn`
  return `${s}sn`
}

function formatDigitalClock(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function convertSecondsToText(totalSeconds: number): string {
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

// Fallback mock API for Web Preview (e.g. Netlify)
let mockWebState: ShutdownState = { kind: 'idle' }
let mockWebTimer: NodeJS.Timeout | null = null

const createMockWebApi = () => ({
  schedule: async (totalSeconds: number): Promise<ApiResult<ShutdownPlan>> => {
    if (mockWebTimer) clearTimeout(mockWebTimer)
    const preWaitSeconds = totalSeconds > 600 ? totalSeconds - 600 : 0
    const shutdownTSeconds = totalSeconds > 600 ? 600 : totalSeconds
    const targetEpochMs = Date.now() + totalSeconds * 1000

    if (preWaitSeconds > 0) {
      mockWebState = {
        kind: 'prewait',
        endsAtEpochMs: Date.now() + preWaitSeconds * 1000,
        totalSeconds,
      }
      mockWebTimer = setTimeout(() => {
        mockWebState = {
          kind: 'scheduled',
          shutdownTSeconds,
          targetEpochMs: Date.now() + shutdownTSeconds * 1000,
          totalSeconds,
        }
      }, preWaitSeconds * 1000)
    } else {
      mockWebState = {
        kind: 'scheduled',
        shutdownTSeconds,
        targetEpochMs,
        totalSeconds,
      }
    }
    return { ok: true, value: { totalSeconds, preWaitSeconds, shutdownTSeconds } }
  },
  cancel: async (): Promise<ApiResult<true>> => {
    if (mockWebTimer) clearTimeout(mockWebTimer)
    mockWebState = { kind: 'idle' }
    return { ok: true, value: true }
  },
  status: async (): Promise<ApiResult<{ state: ShutdownState; raw: string }>> => {
    let raw = ''
    if (mockWebState.kind === 'idle') {
      raw = '[Web Önizleme] Zamanlayıcı pasif.'
    } else if (mockWebState.kind === 'prewait') {
      raw = '[Web Önizleme] Ön bekleme modunda simülasyon çalışıyor.'
    } else {
      raw = '[Web Önizleme] Kapanma zamanlandı simülasyonu çalışıyor.'
    }
    return { ok: true, value: { state: mockWebState, raw } }
  },
  onState: (cb: (state: ShutdownState) => void) => {
    const t = setInterval(() => cb(mockWebState), 500)
    return () => clearInterval(t)
  },
})

const PRESETS = [
  { label: '15 dk', seconds: 15 * 60 },
  { label: '30 dk', seconds: 30 * 60 },
  { label: '45 dk', seconds: 45 * 60 },
  { label: '1 saat', seconds: 1 * 3600 },
  { label: '1.5 saat', seconds: 1.5 * 3600 },
  { label: '2 saat', seconds: 2 * 3600 },
]

export default function App() {
  const isElectron = Boolean(window.sureliKapatma)
  const api = useMemo(() => window.sureliKapatma || createMockWebApi(), [])

  const [duration, setDuration] = useState('45m')
  const [wheel, setWheel] = useState({ hours: 0, minutes: 45 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [rawStatus, setRawStatus] = useState<string>('')
  const [state, setState] = useState<ShutdownState>({ kind: 'idle' })
  const [now, setNow] = useState(Date.now())

  // Keep state updated from main process
  useEffect(() => {
    const off = api.onState((s) => setState(s))
    return () => off()
  }, [api])

  // Timer ticker for live countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const parsed = useMemo(() => parseDurationToSeconds(duration), [duration])
  const wheelSeconds = wheel.hours * 3600 + wheel.minutes * 60

  // Sync wheel -> duration text
  const handleWheelChange = useCallback((newWheel: { hours: number; minutes: number }) => {
    setWheel(newWheel)
    const secs = newWheel.hours * 3600 + newWheel.minutes * 60
    setDuration(convertSecondsToText(secs))
  }, [])

  // Sync text -> wheel
  const handleTextChange = (text: string) => {
    setDuration(text)
    const p = parseDurationToSeconds(text)
    if (p.ok) {
      const h = Math.min(23, Math.floor(p.seconds / 3600))
      const m = Math.min(59, Math.floor((p.seconds % 3600) / 60))
      setWheel({ hours: h, minutes: m })
    }
  }

  // Quick preset handler
  const handlePresetSelect = (presetSecs: number) => {
    const h = Math.floor(presetSecs / 3600)
    const m = Math.floor((presetSecs % 3600) / 60)
    setWheel({ hours: h, minutes: m })
    setDuration(convertSecondsToText(presetSecs))
  }

  const refreshStatus = useCallback(async () => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const res = await api.status()
      if (!res.ok) throw new Error(res.error)
      setRawStatus(res.value.raw)
      setState(res.value.state)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [api])

  async function schedule(targetSeconds: number) {
    setError(null)
    setInfo(null)
    if (targetSeconds <= 0) {
      setError('Süre 0\'dan büyük olmalı.')
      return
    }
    setBusy(true)
    try {
      const res = await api.schedule(targetSeconds)
      if (!res.ok) throw new Error(res.error)
      const plan = res.value
      if (plan.preWaitSeconds > 0) {
        setInfo(
          `Kapatma kuruldu: Toplam ${formatDuration(plan.totalSeconds)}. Önce ${formatDuration(plan.preWaitSeconds)} ön bekleme yapılır, ardından son 10 dk işletim sistemi kapatma zamanlayıcısı devreye girer.`,
        )
      } else {
        setInfo(`Kapatma kuruldu: ${formatDuration(plan.shutdownTSeconds)} sonra bilgisayar kapanacak.`)
      }
      await refreshStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const res = await api.cancel()
      if (!res.ok) throw new Error(res.error)
      setInfo('Zamanlanmış kapatma başarıyla iptal edildi.')
      await refreshStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  // Active state calculations
  let remainingSeconds = 0
  let totalDurationSeconds = 1
  let stateTitle = 'Zamanlayıcı Pasif'
  let stateSubtitle = 'Bilgisayar kapatma işlemi kurulmadı'
  let badgeColor: 'default' | 'success' | 'warning' = 'default'

  if (state.kind === 'prewait') {
    const msLeft = Math.max(0, state.endsAtEpochMs - now)
    const prewaitSecLeft = Math.ceil(msLeft / 1000)
    remainingSeconds = prewaitSecLeft + 600 // total remaining
    totalDurationSeconds = state.totalSeconds
    stateTitle = 'Ön Bekleme Modu Aktif'
    stateSubtitle = `Kapanmaya ${formatDuration(remainingSeconds)} kaldı (${formatDuration(prewaitSecLeft)} sonra Windows zamanlayıcı başlar)`
    badgeColor = 'warning'
  } else if (state.kind === 'scheduled') {
    const msLeft = Math.max(0, state.targetEpochMs - now)
    remainingSeconds = Math.ceil(msLeft / 1000)
    totalDurationSeconds = state.totalSeconds || state.shutdownTSeconds
    stateTitle = 'Windows Kapanma Zamanlandı'
    stateSubtitle = `Bilgisayar ${formatDuration(remainingSeconds)} içinde kapanacak`
    badgeColor = 'success'
  }

  const progressPercent =
    state.kind !== 'idle'
      ? Math.min(100, Math.max(0, ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100))
      : 0

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: 'text.primary',
        background:
          'radial-gradient(1200px 700px at 20% 10%, rgba(56, 189, 248, 0.15), transparent 60%), radial-gradient(900px 600px at 80% 80%, rgba(124, 58, 237, 0.15), transparent 60%), linear-gradient(180deg, #070a12 0%, #060816 100%)',
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              <IconPower sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1 }}>
                Kapatika
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                v1.0 • Geliştirici:
                <Button
                  variant="text"
                  size="small"
                  onClick={() => window.open('https://an1lbayram-github-io.vercel.app/', '_blank')}
                  sx={{
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    fontSize: 'inherit',
                    color: '#38bdf8',
                    fontWeight: 600,
                    '&:hover': { background: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  an1lbayram
                </Button>
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            size="small"
            startIcon={<IconRefresh />}
            onClick={refreshStatus}
            disabled={busy}
            sx={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)',
              borderRadius: 2,
              '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            Yenile
          </Button>
        </Toolbar>
      </AppBar>

      {busy && <LinearProgress sx={{ bgcolor: 'rgba(56, 189, 248, 0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

      {!isElectron && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            bgcolor: 'rgba(56, 189, 248, 0.12)',
            color: '#7dd3fc',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          }}
        >
          <strong>Web Önizleme Modu:</strong> Tarayıcı ortamındasınız. Bilgisayar kapatma komutları yalnızca Windows Electron masaüstü uygulamasında tetiklenir. Arayüz simülasyonunu test edebilirsiniz.
        </Alert>
      )}

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {/* Active Countdown Header Card */}
          {state.kind !== 'idle' && (
            <Card
              sx={{
                borderRadius: 4,
                bgcolor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.15)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Chip
                    label={stateTitle}
                    color={badgeColor}
                    sx={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', tracking: 1 }}
                  />

                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: 2,
                      background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: 'monospace, sans-serif',
                    }}
                  >
                    {formatDigitalClock(remainingSeconds)}
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 500 }}>
                    {stateSubtitle}
                  </Typography>

                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: state.kind === 'prewait' ? '#f59e0b' : '#10b981',
                        },
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    color="error"
                    size="medium"
                    startIcon={<IconCancel />}
                    onClick={cancel}
                    disabled={busy}
                    sx={{ mt: 1, borderRadius: 2.5, px: 4, fontWeight: 700 }}
                  >
                    Kapatmayı İptal Et
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Main Controls Card */}
          <Card
            sx={{
              borderRadius: 4,
              bgcolor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconClock sx={{ color: '#38bdf8' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Kapatma Süresi Belirle
                  </Typography>
                </Stack>

                {/* Quick Presets */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                  {PRESETS.map((p) => (
                    <Chip
                      key={p.label}
                      label={p.label}
                      clickable
                      onClick={() => handlePresetSelect(p.seconds)}
                      sx={{
                        bgcolor: wheelSeconds === p.seconds ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: wheelSeconds === p.seconds ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: wheelSeconds === p.seconds ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.2)' },
                      }}
                    />
                  ))}
                </Stack>

                {/* Duration Wheel & Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                  <DurationWheel value={wheel} onChange={handleWheelChange} />

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                      Seçilen Süre:{' '}
                      <Box component="span" sx={{ color: '#38bdf8', fontWeight: 700, fontSize: 16 }}>
                        {wheelSeconds > 0 ? formatDuration(wheelSeconds) : 'Süre seçin'}
                      </Box>
                    </Typography>

                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<IconPower />}
                      onClick={() => schedule(wheelSeconds)}
                      disabled={busy || wheelSeconds <= 0}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        fontSize: 16,
                        background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                        mb: 1.5,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                        },
                      }}
                    >
                      Kapatmayı Başlat
                    </Button>

                    <Button
                      variant="outlined"
                      size="medium"
                      color="inherit"
                      startIcon={<IconCancel />}
                      onClick={cancel}
                      disabled={busy || state.kind === 'idle'}
                      fullWidth
                      sx={{
                        borderRadius: 2.5,
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      İptal Et
                    </Button>
                  </Box>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* Text Manual Entry Option */}
                <Stack spacing={1.5}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
                    Alternatif Metin Girişi
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                      size="small"
                      label="Örnek: 90, 600s, 10m, 1h30m"
                      value={duration}
                      onChange={(e) => handleTextChange(e.target.value)}
                      error={!parsed.ok}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => parsed.ok && schedule(parsed.seconds)}
                      disabled={busy || !parsed.ok}
                      sx={{ borderRadius: 2, px: 3, bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                      Uygula
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Feedback Alerts */}
          {(error || info) && (
            <Alert
              severity={error ? 'error' : 'success'}
              onClose={() => {
                setError(null)
                setInfo(null)
              }}
              sx={{ borderRadius: 3 }}
            >
              {error ?? info}
            </Alert>
          )}

          {/* Raw Command Output Log Card */}
          <Card
            sx={{
              borderRadius: 4,
              bgcolor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>
                  Sistem Çıktısı (Komut Detayı)
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    overflow: 'auto',
                    maxHeight: 120,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {rawStatus || 'Henüz sistem çıktısı alınmadı. "Yenile" butonuna basarak güncelleyebilirsiniz.'}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
