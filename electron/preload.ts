import { contextBridge, ipcRenderer } from 'electron'
import type { ApiResult, ShutdownPlan, ShutdownState } from './shared'

export type ShutdownApi = {
  schedule: (totalSeconds: number) => Promise<ApiResult<ShutdownPlan>>
  cancel: () => Promise<ApiResult<true>>
  status: () => Promise<ApiResult<{ state: ShutdownState; raw: string }>>
  onState: (cb: (state: ShutdownState) => void) => () => void
}

const api: ShutdownApi = {
  schedule: (totalSeconds) => ipcRenderer.invoke('shutdown:schedule', totalSeconds),
  cancel: () => ipcRenderer.invoke('shutdown:cancel'),
  status: () => ipcRenderer.invoke('shutdown:status'),
  onState: (cb) => {
    const handler = (_: unknown, state: ShutdownState) => cb(state)
    ipcRenderer.on('shutdown:state', handler)
    return () => ipcRenderer.removeListener('shutdown:state', handler)
  },
}

contextBridge.exposeInMainWorld('sureliKapatma', api)

