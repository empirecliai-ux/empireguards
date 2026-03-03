"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const pty = __importStar(require("node-pty"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs-extra"));
const wsl_bridge_1 = require("../shared/wsl-bridge");
const CommandStore_1 = require("../shared/CommandStore");
let mainWindow;
const ptyProcesses = new Map();
let commandStore;
function createWindow() {
    commandStore = new CommandStore_1.CommandStore();
    mainWindow = new electron_1.BrowserWindow({
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
    electron_1.globalShortcut.register('Alt+Control+Shift+C', () => {
        mainWindow.webContents.send('capture-command');
    });
    electron_1.globalShortcut.register('Alt+Control+Shift+P', () => {
        mainWindow.webContents.send('open-password-vault');
    });
}
// Terminal PTY Spawning
electron_1.ipcMain.handle('spawn-pty', (event, { shell, cwd, id }) => {
    const ptyProcess = pty.spawn(shell || 'bash.exe', [], {
        name: 'xterm-color',
        cols: 100,
        rows: 40,
        cwd: cwd || os.homedir(),
        env: process.env,
    });
    ptyProcesses.set(id, ptyProcess);
    ptyProcess.onData((data) => {
        mainWindow.webContents.send(`pty-data-${id}`, data);
    });
    return id;
});
electron_1.ipcMain.on('pty-write', (event, { id, data }) => {
    const ptyProcess = ptyProcesses.get(id);
    if (ptyProcess) {
        ptyProcess.write(data);
    }
});
electron_1.ipcMain.on('pty-resize', (event, { id, cols, rows }) => {
    const ptyProcess = ptyProcesses.get(id);
    if (ptyProcess) {
        ptyProcess.resize(cols, rows);
    }
});
// File System IPC
electron_1.ipcMain.handle('read-dir', async (event, dirPath) => {
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
    }
    catch (error) {
        console.error('Failed to read directory:', error);
        return [];
    }
});
// WSL Bridge methods
electron_1.ipcMain.handle('wsl-to-wsl', async (event, p) => {
    return await wsl_bridge_1.WslBridge.toWsl(p);
});
electron_1.ipcMain.handle('wsl-to-windows', async (event, p) => {
    return await wsl_bridge_1.WslBridge.toWindows(p);
});
// Command Store IPC
electron_1.ipcMain.handle('save-command', async (event, cmd) => {
    return commandStore.saveCommand(cmd);
});
electron_1.ipcMain.handle('get-recent-commands', async (event) => {
    return commandStore.getRecentCommands();
});
electron_1.ipcMain.handle('save-password', async (event, { description, password }) => {
    return commandStore.savePassword(description, password);
});
// Context Menu
electron_1.ipcMain.on('show-context-menu', (event, { path, isDirectory }) => {
    const menu = new electron_1.Menu();
    menu.append(new electron_1.MenuItem({ label: 'Run command here', click: () => event.sender.send('menu-action', { action: 'run-here', path }) }));
    menu.append(new electron_1.MenuItem({ label: 'CD to folder & run', click: () => event.sender.send('menu-action', { action: 'cd-run', path }) }));
    menu.append(new electron_1.MenuItem({ label: 'Open new terminal tab', click: () => event.sender.send('menu-action', { action: 'new-tab', path }) }));
    menu.append(new electron_1.MenuItem({ type: 'separator' }));
    menu.append(new electron_1.MenuItem({ label: 'Open Terminal Here', click: () => event.sender.send('menu-action', { action: 'open-here', path }) }));
    menu.append(new electron_1.MenuItem({ label: 'Run from Current Path', click: () => event.sender.send('menu-action', { action: 'run-current', path }) }));
    menu.popup({ window: electron_1.BrowserWindow.fromWebContents(event.sender) || undefined });
});
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
