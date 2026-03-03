const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Handle IPC commands
  ipcMain.handle('empire-command', (event, command) => {
    console.log('Main process received command:', command);
    return true;
  });

  ipcMain.handle('get-empire-status', () => {
    return { agents: 47, status: 'online' };
  });

  // Window Controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Handle permission requests (Security Lockdown from v38)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Deny all permissions by default for security
    console.log(`Permission denied: ${permission} for ${webContents.getURL()}`);
    return callback(false);
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
