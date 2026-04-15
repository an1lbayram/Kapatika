import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import AdmZip from 'adm-zip'

const VERSION = '2.6.0'
const URL =
  'https://github.com/electron-userland/electron-builder-binaries/archive/refs/tags/winCodeSign-2.6.0.zip'

function localAppData() {
  return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
}

const cacheRoot = path.join(localAppData(), 'electron-builder', 'Cache', 'winCodeSign')
const targetDir = path.join(cacheRoot, `winCodeSign-${VERSION}`)

function download(url, destFile) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destFile)
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close()
          fs.unlinkSync(destFile)
          resolve(download(res.headers.location, destFile))
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
      })
      .on('error', (err) => reject(err))
  })
}

async function main() {
  const needRcedit = !fs.existsSync(path.join(targetDir, 'rcedit-x64.exe'))
  if (fs.existsSync(targetDir) && !needRcedit) {
    console.log(`[prefetch] ok: ${targetDir}`)
    return
  }

  fs.mkdirSync(cacheRoot, { recursive: true })
  const zipPath = path.join(cacheRoot, `winCodeSign-${VERSION}.zip`)

  console.log(`[prefetch] downloading ${URL}`)
  await download(URL, zipPath)

  console.log(`[prefetch] extracting to cache`)
  const zip = new AdmZip(zipPath)
  const prefix = `electron-builder-binaries-winCodeSign-${VERSION}/winCodeSign/`
  const entries = zip.getEntries().filter((e) => e.entryName.startsWith(prefix) && !e.isDirectory)
  if (!entries.length) throw new Error('Zip icinde winCodeSign icerigi bulunamadi.')

  fs.mkdirSync(targetDir, { recursive: true })
  const outBase = path.join(targetDir, 'winCodeSign')
  fs.mkdirSync(outBase, { recursive: true })

  for (const e of entries) {
    const rel = e.entryName.slice(prefix.length)
    const outPath = path.join(outBase, rel)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, e.getData())
  }

  // electron-builder expects rcedit in the toolset root on Windows
  for (const exe of ['rcedit-x64.exe', 'rcedit-ia32.exe']) {
    const from = path.join(outBase, exe)
    const to = path.join(targetDir, exe)
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, to)
    }
  }

  fs.rmSync(zipPath, { force: true })

  console.log(`[prefetch] done: ${targetDir}`)
}

main().catch((e) => {
  console.error(`[prefetch] failed: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})

