const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  spawnPty: (options) => ipcRenderer.invoke('spawn-pty', options),
  ptyWrite: (id, data) => ipcRenderer.send('pty-write', { id, data }),
  ptyResize: (id, cols, rows) => ipcRenderer.send('pty-resize', { id, cols, rows }),
  onPtyData: (id, callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on(`pty-data-${id}`, listener);
    return () => ipcRenderer.removeListener(`pty-data-${id}`, listener);
  },
  onCaptureCommand: (callback) => {
    ipcRenderer.on('capture-command', callback);
    return () => ipcRenderer.removeListener('capture-command', callback);
  },
  onOpenPasswordVault: (callback) => {
    ipcRenderer.on('open-password-vault', callback);
    return () => ipcRenderer.removeListener('open-password-vault', callback);
  },
  // WSL Bridge methods
  toWsl: (path) => ipcRenderer.invoke('wsl-to-wsl', path),
  toWindows: (path) => ipcRenderer.invoke('wsl-to-windows', path),
  // File System
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  // Command Store
  saveCommand: (cmd) => ipcRenderer.invoke('save-command', cmd),
  getRecentCommands: () => ipcRenderer.invoke('get-recent-commands'),
  savePassword: (data) => ipcRenderer.invoke('save-password', data),
  // Context Menu
  showContextMenu: (data) => ipcRenderer.send('show-context-menu', data),
  onMenuAction: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('menu-action', listener);
    return () => ipcRenderer.removeListener('menu-action', listener);
  },
});
