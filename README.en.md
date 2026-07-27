# ⏰ Kapatika - Windows Auto Shutdown Timer

![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MUI](https://img.shields.io/badge/MUI-5-007FFF?logo=mui)
![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

**Kapatika** is a modern Windows desktop shutdown timer application designed to safely schedule system shutdowns after a specified duration or at a precise time using native `shutdown.exe` calls. Built with **Electron**, **React**, **Material-UI (MUI)**, and **Vite**.

🌐 *Türkçe dökümantasyon için [tıklayın](README.md).*

---

## ✨ Features

- ⏳ **Live Countdown & Progress Bar:** Digital clock and visual fill bar for active timers.
- ⚡ **Quick Timer Buttons:** 1-click scheduling with presets like 15m, 30m, 45m, 1h.
- 🔄 **Smart Input Sync:** Time wheel and freeform text input (`90`, `600s`, `10m`, `1h30m`, `2h15m10s`) stay bidirectionally synced.
- 🛑 **Safe Cancel:** Instantly and safely abort any active scheduled shutdown.
- 🎨 **Modern Glassmorphism UI:** Sleek dark mode interface with responsive layout.
- 🛡️ **Security:** Node integration is disabled in renderer; `shutdown.exe` calls execute strictly via IPC in the Electron main process.

---

## 💻 System Requirements

1. **Windows 10 or Windows 11**
2. **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org/)
3. **Git**: [Download Git](https://git-scm.com/)

---

## 🚀 Installation & Getting Started

### ⚡ One-Liner Quick Start

Open PowerShell or Command Prompt and run the single command below to clone, install, and start Kapatika:

```bash
git clone https://github.com/an1lbayram/Kapatika.git && cd Kapatika && npm install && npm run dev
```

---

### 📋 Step-by-Step Installation (For Beginners)

#### 1️⃣ Open Terminal / Command Prompt
Press the Windows Key, type `PowerShell` or `cmd`, and press Enter.

#### 2️⃣ Clone the Repository
```bash
git clone https://github.com/an1lbayram/Kapatika.git
```

#### 3️⃣ Navigate to Project Directory
```bash
cd Kapatika
```

#### 4️⃣ Install Dependencies
```bash
npm install
```

#### 5️⃣ Start the Application
```bash
npm run dev
```
Vite dev server will start and the Electron window will open automatically.

---

## 📦 Building Installer (.exe)

To build a Windows NSIS installer or portable executable:

```bash
npm run dist
```

Output files will be generated in the **`dist/`** directory:
- `Kapatika Setup <version>.exe` (Installer)
- `Kapatika <version>.exe` (Portable)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

**Developer:** [Anıl Bayram](https://github.com/an1lbayram)
