import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Stack, Paper, Alert, TextField, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';

// Tema Ayarları
const theme = createTheme({
  palette: { mode: 'dark' },
  shape: { borderRadius: 12 },
});

// Yardımcı Fonksiyon: String süreyi saniyeye çevirir (örn: "1h30m" -> 5400)
function parseTimeString(t) {
  const trimmed = (t || '').trim();
  if (!trimmed) return { ok: false, error: 'Süre boş olamaz.' };
  
  if (/^\d+$/.test(trimmed)) {
    const sec = Number(trimmed);
    return (!Number.isFinite(sec) || sec <= 0) 
      ? { ok: false, error: 'Süre 0\'dan büyük olmalı.' } 
      : { ok: true, seconds: sec };
  }
  
  const match = trimmed.match(/^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s?)?\s*$/i);
  if (!match) return { ok: false, error: 'Format: 90, 600s, 10m, 1h30m, 2h15m10s' };
  
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  const total = h * 3600 + m * 60 + s;
  
  return (!Number.isFinite(total) || total <= 0) 
    ? { ok: false, error: 'Süre 0\'dan büyük olmalı.' } 
    : { ok: true, seconds: total };
}

// Yardımcı Fonksiyon: Saniyeyi okunabilir formata çevirir
function formatSeconds(sec) {
  const t = Math.max(0, Math.floor(sec));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  
  if (h > 0) return `${h}sa ${m}dk ${s}sn`;
  if (m > 0) return `${m}dk ${s}sn`;
  return `${s}sn`;
}

// Özel Scroll Seçici Bileşeni (Tekerlek Tipi Seçici)
function TimePickerColumn({ label, values, value, onChange, pad2 }) {
  const ref = useRef(null);
  const scrollTimeout = useRef(null);
  const selectedIndex = values.indexOf(value);

  const displayValues = useMemo(() => [null, null, ...values, null, null], [values]);
  const displayValue = pad2 ? String(value).padStart(2, '0') : String(value);

  useEffect(() => {
    if (ref.current && selectedIndex >= 0) {
      ref.current.scrollTo({ top: (selectedIndex + 2) * 44, behavior: 'instant' });
    }
  }, [selectedIndex, values]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const handleScroll = () => {
      if (scrollTimeout.current) cancelAnimationFrame(scrollTimeout.current);
      scrollTimeout.current = requestAnimationFrame(() => {
        const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / 44) - 2));
        if (values[idx] !== value) onChange(values[idx]);
      });
    };
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) cancelAnimationFrame(scrollTimeout.current);
    };
  }, [value, values, onChange]);

  return (
    <Stack spacing={1} sx={{ minWidth: 110 }}>
      <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 0.4 }}>{label}</Typography>
      <Box sx={{ position: 'relative', borderRadius: 3, border: '1px solid rgba(255,255,255,0.10)', bgcolor: 'rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <Box ref={ref} sx={{ height: 220, overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, scrollSnapType: 'y mandatory', maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)' }}>
          {displayValues.map((val, i) => {
            const isPlaceholder = val === null;
            const strVal = isPlaceholder ? '' : (pad2 ? String(val).padStart(2, '0') : String(val));
            return (
              <Box key={`${label}-${i}-${strVal}`} onClick={() => { if (!isPlaceholder) ref.current?.scrollTo({ top: (values.indexOf(val) + 2) * 44, behavior: 'smooth' }) }} 
                   sx={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', fontSize: 18, fontFamily: 'monospace', color: (!isPlaceholder && strVal === displayValue) ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)', transition: 'color 120ms ease', cursor: isPlaceholder ? 'default' : 'pointer', userSelect: 'none' }}>
                {strVal}
              </Box>
            );
          })}
        </Box>
        <Box sx={{ pointerEvents: 'none', position: 'absolute', left: 10, right: 10, top: '50%', transform: 'translateY(-50%)', height: 44, borderRadius: 2, border: '1px solid rgba(255,255,255,0.14)', bgcolor: 'rgba(255,255,255,0.06)', boxShadow: '0 0 0 1px rgba(0,0,0,0.25) inset' }} />
      </Box>
    </Stack>
  );
}

function TimePicker({ value, onChange, maxHours = 23 }) {
  const hoursList = useMemo(() => Array.from({ length: maxHours + 1 }, (_, i) => i), [maxHours]);
  const minutesList = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      <TimePickerColumn label="Saat" values={hoursList} value={value.hours} onChange={h => onChange({ hours: h, minutes: value.minutes })} />
      <TimePickerColumn label="Dakika" values={minutesList} value={value.minutes} onChange={m => onChange({ hours: value.hours, minutes: m })} pad2 />
    </Stack>
  );
}

// Ana Uygulama
export default function App() {
  const [textTime, setTextTime] = useState('45m');
  const [pickerTime, setPickerTime] = useState({ hours: 0, minutes: 45 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rawLog, setRawLog] = useState('');
  const [statusState, setStatusState] = useState({ kind: 'idle' });

  const getApi = () => {
    if (!window.sureliKapatma) throw new Error("Uygulama Electron dışında çalışıyor gibi görünüyor.");
    return window.sureliKapatma;
  };

  useEffect(() => {
    const unsubscribe = window.sureliKapatma?.onState?.((state) => setStatusState(state));
    return () => unsubscribe?.();
  }, []);

  const parsedTextTime = useMemo(() => parseTimeString(textTime), [textTime]);
  const pickerSeconds = pickerTime.hours * 3600 + pickerTime.minutes * 60;
  const remainingSeconds = statusState.kind === 'prewait' ? Math.max(0, Math.ceil((statusState.endsAtEpochMs - Date.now()) / 1000)) : 0;

  useEffect(() => {
    if (statusState.kind !== 'prewait') return;
    const interval = setInterval(() => setStatusState(s => ({ ...s })), 500);
    return () => clearInterval(interval);
  }, [statusState.kind]);

  const fetchStatus = async () => {
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await getApi().status();
      if (!res.ok) throw new Error(res.error);
      setRawLog(res.value.raw);
      setStatusState(res.value.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleText = async () => {
    setError(null); setSuccess(null);
    if (!parsedTextTime.ok) { setError(parsedTextTime.error); return; }
    setLoading(true);
    try {
      const res = await getApi().schedule(parsedTextTime.seconds);
      if (!res.ok) throw new Error(res.error);
      res.value.preWaitSeconds > 0 
        ? setSuccess(`Kapatma kuruldu. Önce ${formatSeconds(res.value.preWaitSeconds)} beklenir, sonra son 10 dk başlar.`)
        : setSuccess(`Kapatma kuruldu: ${formatSeconds(res.value.shutdownTSeconds)} sonra.`);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await getApi().cancel();
      if (!res.ok) throw new Error(res.error);
      setSuccess('İptal edildi (varsa).');
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedLabel = pickerSeconds <= 0 ? 'Süre seçin' : pickerTime.hours > 0 ? `${pickerTime.hours} saat ${String(pickerTime.minutes).padStart(2, '0')} dk` : `${pickerTime.minutes} dk`;
  const statusLabel = statusState.kind === 'idle' ? 'Durum: Boş' : statusState.kind === 'scheduled' ? `Durum: Kapanma zamanlı (t=${statusState.shutdownTSeconds}s)` : `Durum: Beklemede (kalan ${formatSeconds(remainingSeconds)})`;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', color: 'text.primary' }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Toolbar>
            <ScheduleIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flex: 1 }}>Kapatika</Typography>
            <Button color="inherit" startIcon={<RefreshIcon />} onClick={fetchStatus} disabled={loading}>Yenile</Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Stack spacing={2.5}>
            <Paper sx={{ p: 3, backdropFilter: 'blur(10px)', bgcolor: 'rgba(15,18,32,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ScheduleIcon />
                  <Typography variant="h6">Süre seç</Typography>
                </Stack>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                  <TimePicker value={pickerTime} onChange={setPickerTime} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.75 }}>Seçilen: {selectedLabel}</Typography>
                    <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} 
                      onClick={async () => {
                        setError(null); setSuccess(null);
                        if (pickerSeconds <= 0) { setError('Süre 0 dan büyük olmalı.'); return; }
                        setLoading(true);
                        try {
                          const res = await getApi().schedule(pickerSeconds);
                          if (!res.ok) throw new Error(res.error);
                          setSuccess(`Kapatma kuruldu: ${formatSeconds(res.value.shutdownTSeconds)} sonra.`);
                          await fetchStatus();
                        } catch (err) { setError(err instanceof Error ? err.message : String(err)); } 
                        finally { setLoading(false); }
                      }} disabled={loading || pickerSeconds <= 0} fullWidth sx={{ mb: 1 }}>Kapatmayı Başlat</Button>
                    <Button variant="outlined" size="large" color="inherit" startIcon={<CancelIcon />} onClick={handleCancel} disabled={loading} fullWidth>İptal Et</Button>
                  </Box>
                </Stack>
                
                <TextField label="Süre (isteğe bağlı metin)" value={textTime} onChange={e => setTextTime(e.target.value)} helperText='Örnek: "600", "10m", "1h30m"' error={!parsedTextTime.ok} fullWidth sx={{ mt: 2 }} />
                <Button variant="text" onClick={handleScheduleText} disabled={loading || !parsedTextTime.ok} sx={{ alignSelf: 'flex-start' }}>Metinle zamanla</Button>
              </Stack>
            </Paper>

            {(error || success) && <Alert severity={error ? 'error' : 'success'}>{error ?? success}</Alert>}

            <Paper sx={{ p: 3, backdropFilter: 'blur(10px)', bgcolor: 'rgba(15,18,32,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Stack spacing={1.25}>
                <Typography variant="h6">Sistem Durumu</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{statusLabel}</Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.8, mt: 1 }}>Windows Çıktısı (Raw Log)</Typography>
                <Box component="pre" sx={{ m: 0, p: 1.25, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'auto', maxHeight: 220, fontSize: 12 }}>
                  {rawLog || '(Boş)'}
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}