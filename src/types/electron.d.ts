import type { ShutdownApi } from '../../electron/preload'

declare global {
  interface Window {
    sureliKapatma: ShutdownApi
  }
}

export {}

