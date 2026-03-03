import React, { useState, useEffect, useCallback } from 'react';
import { ExplorerPane } from './components/ExplorerPane';
import { TerminalPane } from './components/TerminalPane';
import { CommandCenter } from './components/CommandCenter';
import { useHotkeys } from './hooks/useHotkeys';
import { GitBranch, Play, RefreshCw, Terminal as TerminalIcon, ClipboardList, Zap, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  useHotkeys();
  const [savedCommands, setSavedCommands] = useState<any[]>([]);

  const fetchCommands = useCallback(async () => {
    const commands = await window.electron.getRecentCommands();
    setSavedCommands(commands);
  }, []);

  useEffect(() => {
    fetchCommands();
    // Refresh every few seconds or we could add an IPC listener for 'command-saved'
    const interval = setInterval(fetchCommands, 5000);
    return () => clearInterval(interval);
  }, [fetchCommands]);

  const executeCommand = (cmd: string) => {
    window.electron.ptyWrite('term-1', `${cmd}\r`);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden border-2 border-emerald-500/20">
      {/* Sidebar: Explorer */}
      <div className="w-80 flex flex-col border-r border-emerald-500/30 bg-slate-900/20">
        <ExplorerPane />

        {/* Quick Buttons at bottom of explorer */}
        <div className="p-4 border-t border-emerald-500/30 bg-slate-900/80 backdrop-blur-md shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="empire-header mb-4 text-[10px] flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-fast shadow-[0_0_5px_#10b981]" />
            Active Legion Controls
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
               onClick={() => executeCommand('git status')}
               className="flex items-center gap-2 p-2 bg-slate-950/50 hover:bg-emerald-600/20 text-[10px] rounded border border-emerald-500/20 transition-all hover:border-emerald-500/50 group"
            >
              <GitBranch size={12} className="group-hover:text-emerald-400" /> <span className="group-hover:neon-text-emerald">git sync</span>
            </button>
            <button
               onClick={() => executeCommand('npm run dev')}
               className="flex items-center gap-2 p-2 bg-slate-950/50 hover:bg-emerald-600/20 text-[10px] rounded border border-emerald-500/20 transition-all hover:border-emerald-500/50 group"
            >
              <Play size={12} className="group-hover:text-emerald-400" /> <span className="group-hover:neon-text-emerald">dev run</span>
            </button>
            <button
               onClick={() => executeCommand('touch .reload-sentinel')}
               className="flex items-center gap-2 p-2 bg-slate-950/50 hover:bg-emerald-600/20 text-[10px] rounded border border-emerald-500/20 transition-all hover:border-emerald-500/50 col-span-2 justify-center group"
            >
              <RefreshCw size={12} className="group-hover:text-emerald-400" /> <span className="group-hover:neon-text-emerald">touch .reload-sentinel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header/Tabs */}
        <div className="h-12 border-b border-emerald-500/30 flex items-center px-4 bg-slate-900/50 justify-between backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
               <TerminalIcon size={14} className="animate-pulse" />
               <span className="text-xs font-bold tracking-widest uppercase">bash-main@nexus</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/40 border border-slate-700 rounded text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer group">
               <Zap size={12} className="group-hover:animate-bounce" />
               <span className="text-[10px] font-bold uppercase tracking-tight">Active Pulse: 12ms</span>
            </div>
          </div>
          <CommandCenter onExecute={executeCommand} />
        </div>

        {/* Content */}
        <div className="flex-1 relative flex overflow-hidden">
          <TerminalPane id="term-1" cwd={process.cwd()} />

          {/* Right Sidebar for Saved Commands */}
          <div className="w-72 border-l border-emerald-500/30 bg-slate-900/40 flex flex-col backdrop-blur-sm">
            <div className="p-4 empire-header border-b border-emerald-500/20 flex items-center gap-2 bg-slate-900/60">
               <ClipboardList size={14} className="text-emerald-500" />
               <span>Command Clipboard</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
               {savedCommands.length === 0 && (
                 <div className="text-[10px] text-slate-600 italic text-center py-10">
                   No intelligence gathered yet...
                   <br/>Press <span className="text-emerald-500/50">Alt+Ctrl+Shift+C</span> to capture.
                 </div>
               )}
               {savedCommands.map((cmd) => (
                 <div
                   key={cmd.id}
                   onClick={() => executeCommand(cmd.full_command)}
                   className="p-3 bg-slate-950/40 border border-emerald-500/10 rounded-lg text-[10px] hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-all group relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={10} className="text-emerald-500" />
                    </div>
                    <div className="text-emerald-400 font-bold mb-1 italic flex items-center gap-1">
                      <Zap size={10} className="text-emerald-600" />
                      {cmd.category || 'General'}
                    </div>
                    <div className="text-slate-200 font-medium mb-1 leading-relaxed">{cmd.summary}</div>
                    <div className="opacity-40 truncate font-mono bg-black/30 p-1 rounded border border-white/5 group-hover:opacity-80 transition-opacity">
                      {cmd.command_only}
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-4 border-t border-emerald-500/20 bg-slate-950/50">
               <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-2">
                 <ShieldCheck size={12} />
                 Vault Status: Secure
               </div>
               <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_10px_#10b981]" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
