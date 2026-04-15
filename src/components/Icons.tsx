import { SvgIcon, type SvgIconProps } from '@mui/material'

export function IconPower(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 2h2v10h-2V2z" />
      <path d="M7.76 5.05a8 8 0 1 0 8.48 0l-1.06 1.7a6 6 0 1 1-6.36 0l-1.06-1.7z" />
    </SvgIcon>
  )
}

export function IconClock(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 2a8 8 0 1 1-.001 16.001A8 8 0 0 1 12 4z" />
      <path d="M11 6h2v6.1l3.6 2.1-1 1.7L11 13V6z" />
    </SvgIcon>
  )
}

export function IconRefresh(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V6a6 6 0 1 1-6 6H4a8 8 0 1 0 13.65-5.65z" />
    </SvgIcon>
  )
}

export function IconCancel(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm4.24 13.66-1.41 1.41L12 13.41l-2.83 2.83-1.41-1.41L10.59 12 7.76 9.17l1.41-1.41L12 10.59l2.83-2.83 1.41 1.41L13.41 12l2.83 2.83z" />
    </SvgIcon>
  )
}

