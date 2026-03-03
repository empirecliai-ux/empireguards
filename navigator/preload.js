const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('empireApi', {
    // Empire Commands
    invokeCommand: (command) => ipcRenderer.invoke('empire-command', command),
    getEmpireStatus: () => ipcRenderer.invoke('get-empire-status'),

    // Window Controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
});
