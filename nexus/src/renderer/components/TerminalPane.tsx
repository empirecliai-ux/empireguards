import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { QrCode } from 'lucide-react';
import { QrGenerator } from './QrGenerator';

interface TerminalPaneProps {
  id: string;
  cwd?: string;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, cwd }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xterm = useRef<Terminal | null>(null);
  const [currentPath, setCurrentPath] = useState(cwd || '~');
  const isFocused = useRef(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    xterm.current = new Terminal({
      theme: {
        background: '#020617', // Slate-950
        foreground: '#34d399', // Emerald-400
        cursor: '#10b981',     // Emerald-500
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

    const fitAddon = new FitAddon();
    xterm.current.loadAddon(fitAddon);
    xterm.current.open(terminalRef.current);

    // Slight delay to ensure container is rendered before fitting
    setTimeout(() => fitAddon.fit(), 100);

    // Spawn PTY
    (window as any).electron.spawnPty({ id, cwd, shell: 'bash.exe' });

    // IPC listener for data from PTY
    const cleanupData = (window as any).electron.onPtyData(id, (data: string) => {
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
        (window as any).electron.ptyResize(id, xterm.current.cols, xterm.current.rows);
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

  const [showQr, setShowQr] = useState(false);

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col relative border border-emerald-500/20 m-1 rounded shadow-neon-emerald/20">
      {/* Terminal Header */}
      <div className="bg-slate-900/80 border-b border-emerald-500/20 p-1 px-3 flex justify-between items-center">
        <div className="text-[10px] font-mono flex items-center gap-2">
          <span className="text-emerald-500 font-bold tracking-tighter">EMPIRE@COMMAND:</span>
          <span className="text-slate-400 opacity-80 truncate max-w-[300px]">{currentPath}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
           <button
             onClick={() => setShowQr(true)}
             className="p-1 hover:bg-emerald-500/10 rounded text-slate-400 hover:text-emerald-400 transition-colors"
             title="Generate QR Command"
           >
             <QrCode size={12} />
           </button>
        </div>
      </div>

      <div ref={terminalRef} className="flex-1 w-full p-2 overflow-hidden" />

      {showQr && (
        <QrGenerator
          currentPath={currentPath}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
};
