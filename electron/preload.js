const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sureliKapatma', {
    schedule: (seconds) => ipcRenderer.invoke('schedule', seconds),
    cancel: () => ipcRenderer.invoke('cancel'),
    status: () => ipcRenderer.invoke('status'),
    onState: (callback) => {
        // Gelecekte Electron'dan React'a anlık (push) veri göndermek isterseniz kullanılabilir
        return () => {};
    }
});