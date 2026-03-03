# Building the Unbreakable Command Center

## 1. Resilience & Recovery
- **Auto-Reconnect PTY**: If a terminal session dies or WSL restarts, the backend will automatically attempt to respawn the PTY in the same `cwd`.
- **State Persistence**: The current open tabs, their working directories, and layout are saved in real-time. On crash/restart, the app restores the exact same environment.
- **Process Isolation**: Each terminal tab runs its own PTY process. A crash in one shell won't affect the rest of the app.

## 2. WSL Integration
- **Path Mapping**: Automatic translation between `/mnt/c/Users/...` and `C:\Users\...` using `wslpath`.
- **Interop Shell**: A specialized "Empire Shell" mode that detects if a command is Windows-native (e.g., `powershell.exe`) and runs it correctly while maintaining the Linux environment context.
- **Drive Watcher**: Automatically detects when Windows drives are unmounted/remounted and updates the explorer.

## 3. Automation & Hooks (Antigrav Watchers)
- **Dropbox Sync**: A `chokidar` watcher monitors the Dropbox folder for new `.tsx` square files.
  - Trigger: File added/changed.
  - Action: Notification via Electron Toast + `git commit -m "New RSI square landed" && git push` if the repo is clean.
- **Legion Plugins**:
  - `spawn-square`: Command line utility that integrates with the UI to show a progress bar in the terminal header.
  - `power-automate`: IPC hook to trigger Power Automate flows via their local API or CLI.

## 4. UI/UX Refinements
- **Drag-and-Drop**: Dragging a file from the Explorer into the Terminal automatically inserts the escaped path.
- **Emerald Pulse**: When a long-running command (like a build) finishes, the terminal tab border pulses Emerald if successful, Red if failed.
- **Clipboard History**: Integrated clipboard manager (Alt+V) that stores the last 50 snippets, specifically highlighting command-line strings.

## 5. Error Handling
- **Graceful Failover**: If `node-pty` fails to load (e.g., missing dependencies), the app falls back to a basic `child_process` execution mode to maintain core functionality.
- **Crash Reporting**: Local logs are stored in `.empire/logs/` with detailed stack traces for every IPC failure.
