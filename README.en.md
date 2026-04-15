# Kapatika (Desktop)

[Türkçe](./README.md)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=electron&logoColor=white)

A Windows shutdown timer application. Developed with Electron and React. It securely shuts down your operating system after a specified duration using `shutdown.exe` calls.

## Technology Stack

- **Frontend:** React, Material-UI (MUI), Vite
- **Desktop Framework:** Electron, electron-builder

## Features

- **Flexible time formats**: `90`, `600s`, `10m`, `1h`, `1h30m`, `2h15m10s`
- **Cancel Option**: Instantly cancel a scheduled shutdown.
- **User-Friendly Interface**: Set shutdown time in seconds with a wheel-style scroll picker.

## Development

```bash
npm install
npm run dev
```

> Note: `npm run dev` starts the Vite server and automatically switches to another port if the default is busy. Electron opens with the correct URL automatically.

## Build (release)

```bash
npm run dist
```

The output is generated under `dist/` (renderer) and `dist-electron/` (main/preload); `electron-builder` produces an installer/portable for Windows.

## Security

- Node integration is **disabled** in the renderer process.
- `shutdown.exe` calls are made only from the Electron **main process** via IPC (Context Bridge).

## Note: electron-builder (Windows) symlink error

On some Windows setups, `electron-builder` can fail when extracting the `winCodeSign` archive due to **symbolic link** permission issues.
This project automatically populates the `winCodeSign` cache with a **symlink-free zip** before `npm run dist` (`scripts/prefetch-winCodeSign.mjs`).
