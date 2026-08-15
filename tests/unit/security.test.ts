import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..', '..')

function getCspContent(html: string): string {
  const match = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)
  if (!match) throw new Error('CSP meta tag not found in index.html')
  return match[1]
}

describe('Content-Security-Policy (index.html)', () => {
  const html = readFileSync(path.join(root, 'index.html'), 'utf-8')
  const csp = getCspContent(html)
  const directives = Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...values] = d.split(/\s+/)
        return [name, values]
      }),
  )

  it('has a default-src fallback restricted to self', () => {
    expect(directives['default-src']).toEqual(["'self'"])
  })

  it('does not allow unsafe-inline or unsafe-eval scripts', () => {
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/)
  })

  it('restricts script-src to self only', () => {
    expect(directives['script-src']).toEqual(["'self'"])
  })

  it('does not use a wildcard source anywhere in the policy', () => {
    expect(csp).not.toMatch(/[\s:]\*(?=[\s;]|$)/)
  })

  it('disallows plugin/object embeds', () => {
    expect(directives['object-src']).toEqual(["'none'"])
  })

  it('restricts form submission targets to self', () => {
    expect(directives['form-action']).toEqual(["'self'"])
  })

  it('restricts base-uri to self (mitigates base-tag injection)', () => {
    expect(directives['base-uri']).toEqual(["'self'"])
  })

  it('only allow-lists known, required third-party origins for connect-src', () => {
    const allowed = new Set(["'self'", 'https://vitals.vercel-insights.com'])
    for (const src of directives['connect-src'] ?? []) {
      expect(allowed.has(src)).toBe(true)
    }
  })
})

describe('Electron main-process hardening (source assertions)', () => {
  const mainSrc = readFileSync(path.join(root, 'electron', 'main.ts'), 'utf-8')

  it('keeps contextIsolation enabled', () => {
    expect(mainSrc).toMatch(/contextIsolation:\s*true/)
  })

  it('keeps nodeIntegration disabled', () => {
    expect(mainSrc).toMatch(/nodeIntegration:\s*false/)
  })

  it('keeps the renderer sandboxed', () => {
    expect(mainSrc).toMatch(/sandbox:\s*true/)
  })

  it('only opens external http(s) URLs, denying every window.open request in-app', () => {
    expect(mainSrc).toMatch(/setWindowOpenHandler/)
    expect(mainSrc).toMatch(/action:\s*'deny'/)
    expect(mainSrc).toMatch(/protocol === 'http:' \|\| parsed\.protocol === 'https:'/)
  })

  it('does not use nodeIntegration-only APIs like require() inside the renderer bridge', () => {
    const preloadSrc = readFileSync(path.join(root, 'electron', 'preload.ts'), 'utf-8')
    expect(preloadSrc).toMatch(/contextBridge\.exposeInMainWorld/)
    // Only a fixed, minimal API surface should cross the bridge - no raw ipcRenderer.
    expect(preloadSrc).not.toMatch(/exposeInMainWorld\(['"]\w+['"],\s*ipcRenderer\)/)
  })

  it('runs shutdown via execFile with an argv array, never a shell string (no command injection surface)', () => {
    expect(mainSrc).toMatch(/execFile\(/)
    expect(mainSrc).not.toMatch(/exec\(`/)
    expect(mainSrc).not.toMatch(/shell:\s*true/)
  })
})
