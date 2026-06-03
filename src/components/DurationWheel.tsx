import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'

type WheelColumnProps = {
  label: string
  values: number[]
  value: number
  onChange: (v: number) => void
  pad2?: boolean
}

function clampIndex(i: number, min: number, max: number) {
  return Math.max(min, Math.min(max, i))
}

function WheelColumn({ label, values, value, onChange, pad2 }: WheelColumnProps) {
  const itemH = 44
  const pad = 2 // top/bottom padding items for nicer centering
  const list = useMemo(() => {
    const head = Array.from({ length: pad }, () => null as unknown as number)
    const tail = Array.from({ length: pad }, () => null as unknown as number)
    return [...head, ...values, ...tail]
  }, [values])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const selectedIndex = values.indexOf(value)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (selectedIndex < 0) return
    const top = selectedIndex * itemH
    el.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
  }, [selectedIndex, itemH])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / itemH)
        const clamped = clampIndex(idx, 0, values.length - 1)
        const next = values[clamped]
        if (next !== value) onChange(next)
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [itemH, onChange, value, values])

  const selectedText = pad2 ? String(value).padStart(2, '0') : String(value)

  return (
    <Stack spacing={1} sx={{ minWidth: 110 }}>
      <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 0.4 }}>
        {label}
      </Typography>

      <Box
        sx={{
          position: 'relative',
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.10)',
          bgcolor: 'rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        <Box
          ref={containerRef}
          sx={{
            height: itemH * 5,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollSnapType: 'y mandatory',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
          }}
        >
          {list.map((v, i) => {
            const isBlank = typeof v !== 'number'
            const txt = isBlank ? '' : pad2 ? String(v).padStart(2, '0') : String(v)
            const isSelected = !isBlank && txt === selectedText
            return (
              <Box
                key={`${label}-${i}-${txt}`}
                sx={{
                  height: itemH,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scrollSnapAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 18,
                  color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
                  transition: 'color 120ms ease',
                  cursor: isBlank ? 'default' : 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => {
                  if (isBlank) return
                  const idx = values.indexOf(v)
                  if (idx < 0) return
                  containerRef.current?.scrollTo({ top: idx * itemH, behavior: 'smooth' })
                }}
              >
                {txt}
              </Box>
            )
          })}
        </Box>

        <Box
          sx={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 10,
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            height: itemH,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.14)',
            bgcolor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.25) inset',
          }}
        />
      </Box>
    </Stack>
  )
}

export type DurationWheelValue = {
  hours: number
  minutes: number
}

export type DurationWheelProps = {
  value: DurationWheelValue
  onChange: (v: DurationWheelValue) => void
  maxHours?: number
}

export function DurationWheel({ value, onChange, maxHours = 23 }: DurationWheelProps) {
  const hours = useMemo(() => Array.from({ length: maxHours + 1 }, (_, i) => i), [maxHours])
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), [])

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      <WheelColumn
        label="Saat"
        values={hours}
        value={value.hours}
        onChange={(v) => onChange({ hours: v, minutes: value.minutes })}
      />
      <WheelColumn
        label="Dakika"
        values={minutes}
        value={value.minutes}
        onChange={(v) => onChange({ hours: value.hours, minutes: v })}
        pad2
      />
    </Stack>
  )
}

