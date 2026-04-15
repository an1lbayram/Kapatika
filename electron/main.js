const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let targetTime = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Vite ortamında geliştirme url'si, üretim ortamında build edilmiş html
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('schedule', async(event, seconds) => {
    return new Promise((resolve) => {
        exec(`shutdown.exe -s -t ${seconds}`, (err) => {
            if (err) {
                resolve({ ok: false, error: err.message });
            } else {
                targetTime = Date.now() + seconds * 1000;
                resolve({ ok: true, value: { shutdownTSeconds: seconds, preWaitSeconds: 0 } });
            }
        });
    });
});

ipcMain.handle('cancel', async() => {
    return new Promise((resolve) => {
        exec('shutdown.exe -a', (err) => {
            if (err) {
                resolve({ ok: false, error: err.message });
            } else {
                targetTime = null;
                resolve({ ok: true });
            }
        });
    });
});

ipcMain.handle('status', () => {
    if (targetTime) {
        const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
        return { ok: true, value: { raw: "Zamanlanmış görev mevcut.", state: { kind: 'scheduled', shutdownTSeconds: remaining } } };
    }
    return { ok: true, value: { raw: "Görev yok.", state: { kind: 'idle' } } };
});