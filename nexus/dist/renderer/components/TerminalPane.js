"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalPane = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const xterm_1 = require("xterm");
const xterm_addon_fit_1 = require("xterm-addon-fit");
require("xterm/css/xterm.css");
const lucide_react_1 = require("lucide-react");
const QrGenerator_1 = require("./QrGenerator");
const TerminalPane = ({ id, cwd }) => {
    const terminalRef = (0, react_1.useRef)(null);
    const xterm = (0, react_1.useRef)(null);
    const [currentPath, setCurrentPath] = (0, react_1.useState)(cwd || '~');
    const isFocused = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (!terminalRef.current)
            return;
        xterm.current = new xterm_1.Terminal({
            theme: {
                background: '#020617', // Slate-950
                foreground: '#34d399', // Emerald-400
                cursor: '#10b981', // Emerald-500
                selectionBackground: 'rgba(52, 211, 153, 0.3)',
                black: '#020617',
                red: '#ef4444',
                green: '#10b981',
                yellow: '#f59e0b',
                blue: '#3b82f6',
                magenta: '#8b5cf6',
                cyan: '#06b6d4',
                white: '#e2e8f0',
            },
            fontFamily: '"Fira Code", "Courier New", monospace',
            fontSize: 13,
            cursorBlink: true,
            allowProposedApi: true,
        });
        const fitAddon = new xterm_addon_fit_1.FitAddon();
        xterm.current.loadAddon(fitAddon);
        xterm.current.open(terminalRef.current);
        // Slight delay to ensure container is rendered before fitting
        setTimeout(() => fitAddon.fit(), 100);
        // Spawn PTY
        window.electron.spawnPty({ id, cwd, shell: 'bash.exe' });
        // IPC listener for data from PTY
        const cleanupData = window.electron.onPtyData(id, (data) => {
            xterm.current?.write(data);
        });
        // Write input to PTY
        xterm.current.onData((data) => {
            window.electron.ptyWrite(id, data);
        });
        xterm.current.textarea?.addEventListener('focus', () => { isFocused.current = true; });
        xterm.current.textarea?.addEventListener('blur', () => { isFocused.current = false; });
        // Handle Resize
        const handleResize = () => {
            fitAddon.fit();
            if (xterm.current) {
                window.electron.ptyResize(id, xterm.current.cols, xterm.current.rows);
            }
        };
        window.addEventListener('resize', handleResize);
        // Listen for menu actions (CD to folder etc)
        const cleanupMenu = window.electron.onMenuAction(({ action, path: targetPath }) => {
            if (action === 'cd-run' || action === 'open-here') {
                window.electron.ptyWrite(id, `cd "${targetPath}"\r`);
                setCurrentPath(targetPath);
            }
        });
        // Listen for capture request
        const cleanupCapture = window.electron.onCaptureCommand(async () => {
            if (xterm.current && isFocused.current) {
                const buffer = xterm.current.buffer.active;
                const line = buffer.getLine(buffer.cursorY + buffer.baseY)?.translateToString(true).trim();
                if (line) {
                    // Basic summary via regex or just first part
                    const summary = line.length > 60 ? line.substring(0, 57) + "..." : line;
                    await window.electron.saveCommand({
                        full_command: line,
                        command_only: line.split(' ').slice(0, 3).join(' '), // Mock strip paths
                        path: currentPath,
                        summary: `Empire captured: ${summary}`,
                        category: 'Captured'
                    });
                    // Visual feedback could be added here
                }
            }
        });
        return () => {
            cleanupCapture();
            cleanupData();
            cleanupMenu();
            window.removeEventListener('resize', handleResize);
            xterm.current?.dispose();
        };
    }, [id]);
    const [showQr, setShowQr] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 h-full bg-slate-950 flex flex-col relative border border-emerald-500/20 m-1 rounded shadow-neon-emerald/20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-slate-900/80 border-b border-emerald-500/20 p-1 px-3 flex justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-[10px] font-mono flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-emerald-500 font-bold tracking-tighter", children: "EMPIRE@COMMAND:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-400 opacity-80 truncate max-w-[300px]", children: currentPath })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowQr(true), className: "p-1 hover:bg-emerald-500/10 rounded text-slate-400 hover:text-emerald-400 transition-colors", title: "Generate QR Command", children: (0, jsx_runtime_1.jsx)(lucide_react_1.QrCode, { size: 12 }) })] })] }), (0, jsx_runtime_1.jsx)("div", { ref: terminalRef, className: "flex-1 w-full p-2 overflow-hidden" }), showQr && ((0, jsx_runtime_1.jsx)(QrGenerator_1.QrGenerator, { currentPath: currentPath, onClose: () => setShowQr(false) }))] }));
};
exports.TerminalPane = TerminalPane;
