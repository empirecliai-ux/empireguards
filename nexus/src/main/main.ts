import { app, BrowserWindow, ipcMain, globalShortcut, Menu, MenuItem } from 'electron';
import * as pty from 'node-pty';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import { WslBridge } from '../shared/wsl-bridge';
import { CommandStore } from '../shared/CommandStore';

let mainWindow: BrowserWindow;
const ptyProcesses: Map<string, pty.IPty> = new Map();
let commandStore: CommandStore;

function createWindow() {
  commandStore = new CommandStore();

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    frame: false,
    backgroundColor: '#020617', // Slate-950
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  // Register Global Hotkeys
  globalShortcut.register('Alt+Control+Shift+C', () => {
    mainWindow.webContents.send('capture-command');
  });

  globalShortcut.register('Alt+Control+Shift+P', () => {
    mainWindow.webContents.send('open-password-vault');
  });
}

// Terminal PTY Spawning
ipcMain.handle('spawn-pty', (event, { shell, cwd, id }) => {
  const ptyProcess = pty.spawn(shell || 'bash.exe', [], {
    name: 'xterm-color',
    cols: 100,
    rows: 40,
    cwd: cwd || os.homedir(),
    env: process.env as any,
  });

  ptyProcesses.set(id, ptyProcess);

  ptyProcess.onData((data) => {
    mainWindow.webContents.send(`pty-data-${id}`, data);
  });

  return id;
});

ipcMain.on('pty-write', (event, { id, data }) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('pty-resize', (event, { id, cols, rows }) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.resize(cols, rows);
  }
});

// File System IPC
ipcMain.handle('read-dir', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    const nodes = await Promise.all(files.map(async (file) => {
      const fullPath = path.join(dirPath, file);
      const stats = await fs.stat(fullPath);
      return {
        id: fullPath,
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
      };
    }));
    return nodes;
  } catch (error) {
    console.error('Failed to read directory:', error);
    return [];
  }
});

// WSL Bridge methods
ipcMain.handle('wsl-to-wsl', async (event, p) => {
  return await WslBridge.toWsl(p);
});

ipcMain.handle('wsl-to-windows', async (event, p) => {
  return await WslBridge.toWindows(p);
});

// Command Store IPC
ipcMain.handle('save-command', async (event, cmd) => {
  return commandStore.saveCommand(cmd);
});

ipcMain.handle('get-recent-commands', async (event) => {
  return commandStore.getRecentCommands();
});

ipcMain.handle('save-password', async (event, { description, password }) => {
  return commandStore.savePassword(description, password);
});

// Context Menu
ipcMain.on('show-context-menu', (event, { path, isDirectory }) => {
  const menu = new Menu();
  menu.append(new MenuItem({ label: 'Run command here', click: () => event.sender.send('menu-action', { action: 'run-here', path }) }));
  menu.append(new MenuItem({ label: 'CD to folder & run', click: () => event.sender.send('menu-action', { action: 'cd-run', path }) }));
  menu.append(new MenuItem({ label: 'Open new terminal tab', click: () => event.sender.send('menu-action', { action: 'new-tab', path }) }));
  menu.append(new MenuItem({ type: 'separator' }));
  menu.append(new MenuItem({ label: 'Open Terminal Here', click: () => event.sender.send('menu-action', { action: 'open-here', path }) }));
  menu.append(new MenuItem({ label: 'Run from Current Path', click: () => event.sender.send('menu-action', { action: 'run-current', path }) }));

  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) || undefined });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
