import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { DurationWheel } from './components/DurationWheel'
import { IconCancel, IconClock, IconPower, IconRefresh } from './components/Icons'

type ShutdownState =
  | { kind: 'idle' }
  | { kind: 'prewait'; endsAtEpochMs: number; totalSeconds: number }
  | { kind: 'scheduled'; shutdownTSeconds: number }

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
  if (!m) return { ok: false, error: 'Format: 90, 600s, 10m, 1h30m, 2h15m10s' }

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

export default function App() {
  const [duration, setDuration] = useState('45m')
  const [wheel, setWheel] = useState({ hours: 0, minutes: 45 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [rawStatus, setRawStatus] = useState<string>('')
  const [state, setState] = useState<ShutdownState>({ kind: 'idle' })

  useEffect(() => {
    const off = window.sureliKapatma?.onState?.((s) => setState(s as unknown as ShutdownState))
    return () => off?.()
  }, [])

  function getApi() {
    const api = window.sureliKapatma
    if (!api) throw new Error('Uygulama Electron dışında çalışıyor gibi görünüyor.')
    return api
  }

  const parsed = useMemo(() => parseDurationToSeconds(duration), [duration])
  const wheelSeconds = wheel.hours * 3600 + wheel.minutes * 60

  const remainingPrewaitSeconds =
    state.kind === 'prewait' ? Math.max(0, Math.ceil((state.endsAtEpochMs - Date.now()) / 1000)) : 0

  useEffect(() => {
    if (state.kind !== 'prewait') return
    const t = setInterval(() => setState((s) => ({ ...s })), 500)
    return () => clearInterval(t)
  }, [state.kind])

  async function refreshStatus() {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const res = await getApi().status()
      if (!res.ok) throw new Error(res.error)
      setRawStatus(res.value.raw)
      setState(res.value.state as unknown as ShutdownState)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function schedule() {
    setError(null)
    setInfo(null)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setBusy(true)
    try {
      const res = await getApi().schedule(parsed.seconds)
      if (!res.ok) throw new Error(res.error)
      const plan = res.value
      if (plan.preWaitSeconds > 0) {
        setInfo(
          `Kapatma kuruldu. Önce ${formatDuration(plan.preWaitSeconds)} beklenir, sonra son 10 dk başlar.`,
        )
      } else {
        setInfo(`Kapatma kuruldu: ${formatDuration(plan.shutdownTSeconds)} sonra.`)
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
      const res = await getApi().cancel()
      if (!res.ok) throw new Error(res.error)
      setInfo('İptal edildi (varsa).')
      await refreshStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const wheelLabel =
    wheelSeconds <= 0
      ? 'Süre seçin'
      : wheel.hours > 0
        ? `${wheel.hours} saat ${String(wheel.minutes).padStart(2, '0')} dk`
        : `${wheel.minutes} dk`

  const statusLine =
    state.kind === 'idle'
      ? 'Durum: Boş'
      : state.kind === 'scheduled'
        ? `Durum: Kapanma zamanlı (t=${state.shutdownTSeconds}s)`
        : `Durum: Beklemede (kalan ${formatDuration(remainingPrewaitSeconds)})`

  return (
    <Box sx={{ minHeight: '100vh', color: 'text.primary' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Toolbar>
          <IconPower sx={{ mr: 1 }} />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              Kapatika
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Created by
              <Button
                variant="text"
                size="small"
                onClick={() => window.open('https://an1lbayram.github.io/', '_blank')}
                sx={{
                  p: 0,
                  minWidth: 0,
                  textTransform: 'none',
                  fontSize: 'inherit',
                  color: 'inherit',
                  fontWeight: 600,
                  '&:hover': { background: 'transparent', textDecoration: 'underline' }
                }}
              >
                &lt;/&gt; an1lbayram
              </Button>
            </Typography>
          </Box>
          <Button
            color="inherit"
            startIcon={<IconRefresh />}
            onClick={refreshStatus}
            disabled={busy}
          >
            Yenile
          </Button>
        </Toolbar>
      </AppBar>

      {busy && <LinearProgress />}

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2.5}>
          <Card sx={{ backdropFilter: 'blur(10px)', bgcolor: 'rgba(15,18,32,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <IconClock />
                  <Typography variant="h6">Süre seç</Typography>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { sm: 'center' } }}
                >
                  <DurationWheel value={wheel} onChange={setWheel} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.75 }}>
                      Seçilen: {wheelLabel}
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<IconPower />}
                      onClick={async () => {
                        setDuration(String(wheelSeconds))
                        // schedule() duration state'e bağlı; duration güncellenince aynı tick'te parse edilmemesi için direkt çağırıyoruz
                        setError(null)
                        setInfo(null)
                        if (wheelSeconds <= 0) {
                          setError('Süre 0\'dan büyük olmalı.')
                          return
                        }
                        setBusy(true)
                        try {
                          const res = await getApi().schedule(wheelSeconds)
                          if (!res.ok) throw new Error(res.error)
                          const plan = res.value
                          if (plan.preWaitSeconds > 0) {
                            setInfo(
                              `Kapatma kuruldu. Önce ${formatDuration(plan.preWaitSeconds)} beklenir, sonra son 10 dk başlar.`,
                            )
                          } else {
                            setInfo(`Kapatma kuruldu: ${formatDuration(plan.shutdownTSeconds)} sonra.`)
                          }
                          await refreshStatus()
                        } catch (e) {
                          setError(e instanceof Error ? e.message : String(e))
                        } finally {
                          setBusy(false)
                        }
                      }}
                      disabled={busy || wheelSeconds <= 0}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Kapatmayı Başlat
                    </Button>

                    <Button
                      variant="outlined"
                      size="large"
                      color="inherit"
                      startIcon={<IconCancel />}
                      onClick={cancel}
                      disabled={busy}
                      fullWidth
                    >
                      İptal Et
                    </Button>
                  </Box>
                </Stack>

                <Divider sx={{ my: 0.5 }} />

                <TextField
                  label="Süre (isteğe bağlı)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  helperText='Örnek: "600", "10m", "1h30m"'
                  error={!parsed.ok}
                  fullWidth
                />
                <Button
                  variant="text"
                  onClick={schedule}
                  disabled={busy || !parsed.ok}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Metinle zamanla
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {(error || info) && (
            <Alert severity={error ? 'error' : 'success'}>{error ?? info}</Alert>
          )}

          <Card sx={{ backdropFilter: 'blur(10px)', bgcolor: 'rgba(15,18,32,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent>
              <Stack spacing={1.25}>
                <Typography variant="h6">Durum</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {statusLine}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  Windows çıktısı (ham)
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'auto',
                    maxHeight: 220,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontSize: 12,
                  }}
                >
                  {rawStatus || '(Boş)'}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
