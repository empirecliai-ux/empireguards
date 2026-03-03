export interface ElectronAPI {
  spawnPty: (options: { id: string; cwd?: string; shell?: string }) => Promise<string>;
  ptyWrite: (id: string, data: string) => void;
  ptyResize: (id: string, cols: number, rows: number) => void;
  onPtyData: (id: string, callback: (data: string) => void) => () => void;
  onCaptureCommand: (callback: () => void) => () => void;
  onOpenPasswordVault: (callback: () => void) => () => void;
  toWsl: (path: string) => Promise<string>;
  toWindows: (path: string) => Promise<string>;
  readDir: (path: string) => Promise<any[]>;
  saveCommand: (cmd: any) => Promise<void>;
  getRecentCommands: () => Promise<any[]>;
  savePassword: (data: any) => Promise<void>;
  showContextMenu: (data: { path: string; isDirectory: boolean }) => void;
  onMenuAction: (callback: (data: { action: string; path: string }) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
