import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['electron/main.ts', 'electron/preload.ts'],
  outDir: 'dist-electron',
  format: ['cjs'],
  external: ['electron'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  outExtension() {
    return { js: '.cjs' }
  },
})

