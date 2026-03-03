# Empire Terminal + Explorer: Architectural Design

## 1. Overview
The Empire Terminal is a high-performance, unbreakable terminal and file explorer hybrid designed for WSL Ubuntu environments. It serves as the central command center for managing git syncs, square spawning, and live builds.

## 2. Core Architecture
- **Framework**: Electron (Main + Renderer processes)
- **Process Model**:
  - **Main Process**: Handles window management, global hotkeys, PTY (Pseudo-terminal) spawning via `node-pty`, and file system watchers.
  - **Renderer Process**: React-based UI. Communicates with the Main process via IPC for terminal data and file operations.
- **Terminal Engine**: `xterm.js` for high-performance terminal rendering in the browser.
- **File System**: Node.js `fs` API in the Main process, with `chokidar` for real-time file system watching (especially for the "antigrav watchers").

## 3. Tech Stack
- **UI Framework**: React
- **Styling**: Tailwind CSS (Empire Neon Theme: Emerald-500 accents on Slate-950 background)
- **State Management**: Zustand (lightweight and fast)
- **Icons**: Lucide-react
- **Terminal Backend**: `node-pty`
- **Data Persistence**: `better-sqlite3` for saved commands, history, and passwords (encrypted).
- **Communication**: Electron IPC with `contextBridge` for security.
- **WSL Integration**: `wsl-path` for translating between Windows and Linux paths.

## 4. UI/UX Flow
- **Layout**:
  - Sidebar: File Explorer with directory tree.
  - Main Area: Tabbed interface containing Terminal Panes.
  - Right Click: Context menu on explorer items with "Run here", "CD & Run", etc.
- **Hotkeys**:
  - `Alt+Ctrl+Shift+C`: Capture current command + AI Summary (NLP).
  - `Alt+Ctrl+Shift+C+P`: Secure password entry popup.
  - `Ctrl+P`: Command Palette.
- **Command Center**: A categorized dropdown (10 categories, 20 commands each) for quick access to common DevOps/Empire tasks.
- **QR Command Generator**: Integrated utility to convert paths and commands into scanable QR codes for mobile-to-terminal execution or path sharing.

## 5. Security
- **Password Storage**: AES-256-GCM encryption for passwords saved via `Alt+Ctrl+Shift+C+P`.
- **Sandbox**: Renderer processes are sandboxed; all OS access goes through the `contextBridge` and IPC.

## 6. Extensibility
- **Plugin System**: A `plugins` directory where `.js` files can hook into terminal output or explorer events.
- **Auto-sync Hooks**: Specific watcher for Dropbox paths to trigger `git` operations on `.tsx` squares.
