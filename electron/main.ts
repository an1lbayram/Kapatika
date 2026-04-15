import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { execFile } from 'node:child_process'
import type { ApiResult, ShutdownPlan, ShutdownState } from './shared'

let mainWindow: BrowserWindow | null = null

let prewaitTimer: NodeJS.Timeout | null = null
let state: ShutdownState = { kind: 'idle' }

function runShutdown(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile('shutdown', args, { windowsHide: true }, (error, stdout, stderr) => {
      const anyErr = error as (Error & { code?: number }) | null
      resolve({
        code: typeof anyErr?.code === 'number' ? anyErr.code : 0,
        stdout: (stdout ?? '').toString(),
        stderr: (stderr ?? '').toString(),
      })
    })
  })
}

function planLikeLegacy(totalSeconds: number): ShutdownPlan {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    throw new Error('Sure 0 dan buyuk olmali.')
  }
  if (totalSeconds > 600) {
    return { totalSeconds, preWaitSeconds: totalSeconds - 600, shutdownTSeconds: 600 }
  }
  return { totalSeconds, preWaitSeconds: 0, shutdownTSeconds: totalSeconds }
}

async function scheduleShutdown(totalSeconds: number): Promise<ShutdownPlan> {
  // Cancel any previous prewait timer (if user reschedules)
  if (prewaitTimer) {
    clearTimeout(prewaitTimer)
    prewaitTimer = null
  }

  const plan = planLikeLegacy(totalSeconds)

  if (plan.preWaitSeconds > 0) {
    const endsAt = Date.now() + plan.preWaitSeconds * 1000
    state = { kind: 'prewait', endsAtEpochMs: endsAt, totalSeconds: plan.totalSeconds }
    prewaitTimer = setTimeout(async () => {
      prewaitTimer = null
      await runShutdown(['/s', '/t', String(plan.shutdownTSeconds)])
      state = { kind: 'scheduled', shutdownTSeconds: plan.shutdownTSeconds }
      mainWindow?.webContents.send('shutdown:state', state)
    }, plan.preWaitSeconds * 1000)
  } else {
    await runShutdown(['/s', '/t', String(plan.shutdownTSeconds)])
    state = { kind: 'scheduled', shutdownTSeconds: plan.shutdownTSeconds }
  }

  return plan
}

async function cancelShutdown(): Promise<void> {
  if (prewaitTimer) {
    clearTimeout(prewaitTimer)
    prewaitTimer = null
  }
  await runShutdown(['/a'])
  state = { kind: 'idle' }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 640,
    minWidth: 860,
    minHeight: 560,
    show: false,
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('shutdown:schedule', async (_evt, totalSeconds: number): Promise<ApiResult<ShutdownPlan>> => {
  try {
    if (process.platform !== 'win32') return { ok: false, error: 'Bu uygulama Windows icin tasarlandi.' }
    const plan = await scheduleShutdown(totalSeconds)
    mainWindow?.webContents.send('shutdown:state', state)
    return { ok: true, value: plan }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
})

ipcMain.handle('shutdown:cancel', async (): Promise<ApiResult<true>> => {
  try {
    if (process.platform !== 'win32') return { ok: false, error: 'Bu uygulama Windows icin tasarlandi.' }
    await cancelShutdown()
    mainWindow?.webContents.send('shutdown:state', state)
    return { ok: true, value: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
})

ipcMain.handle('shutdown:status', async (): Promise<ApiResult<{ state: ShutdownState; raw: string }>> => {
  try {
    if (process.platform !== 'win32') return { ok: false, error: 'Bu uygulama Windows icin tasarlandi.' }

    // Best-effort raw output (Windows has no clean status command)
    const res = await runShutdown(['/a'])
    const raw = [res.stdout.trim(), res.stderr.trim()].filter(Boolean).join('\n') || `Exit code: ${res.code}`

    // If we're in prewait, keep internal state (not affected by /a output)
    return { ok: true, value: { state, raw } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
})

