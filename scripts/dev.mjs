import { createServer } from 'vite'
import { spawn } from 'node:child_process'

let electronProc = null
let viteServer = null

async function main() {
  viteServer = await createServer({
    configFile: undefined,
    root: process.cwd(),
    server: { port: 5173, strictPort: false },
  })

  await viteServer.listen()
  const url = viteServer.resolvedUrls?.local?.[0]
  if (!url) throw new Error('Vite URL bulunamadi.')

  const env = { ...process.env, VITE_DEV_SERVER_URL: url }
  if (process.platform === 'win32') {
    electronProc = spawn('cmd.exe', ['/d', '/s', '/c', 'npx', 'electron', '.'], {
      stdio: 'inherit',
      env,
    })
  } else {
    electronProc = spawn('npx', ['electron', '.'], {
      stdio: 'inherit',
      env,
    })
  }

  electronProc.on('error', async (e) => {
    console.error(e)
    await viteServer?.close()
    process.exit(1)
  })

  electronProc.on('exit', async (code) => {
    try {
      await viteServer?.close()
    } finally {
      process.exit(code ?? 0)
    }
  })
}

process.on('SIGINT', async () => {
  try {
    electronProc?.kill()
    await viteServer?.close()
  } finally {
    process.exit(0)
  }
})

main().catch(async (e) => {
  console.error(e)
  try {
    electronProc?.kill()
    await viteServer?.close()
  } finally {
    process.exit(1)
  }
})

