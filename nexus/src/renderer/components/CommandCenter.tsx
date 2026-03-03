import React, { useState } from 'react';
import { COMMAND_CATEGORIES } from '../../config/commands';
import { ChevronDown, Terminal, Search, Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CommandCenterProps {
  onExecute: (command: string) => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onExecute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(COMMAND_CATEGORIES[0].name);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommands = COMMAND_CATEGORIES.find(c => c.name === activeCategory)?.commands.filter(cmd =>
    cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 rounded-md text-xs transition-all font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
      >
        <Terminal size={14} />
        Command Nexus
        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-[650px] bg-slate-950 border border-emerald-500/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 flex h-[450px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Categories Sidebar */}
          <div className="w-52 bg-slate-900/50 border-r border-emerald-500/20 p-2 overflow-y-auto">
            <div className="empire-header text-[9px] px-2 mb-2 opacity-50">Intelligence Categories</div>
            {COMMAND_CATEGORIES.map(cat => (
              <div
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  "p-2 text-[10px] cursor-pointer rounded mb-1 transition-all flex items-center gap-2",
                  activeCategory === cat.name
                    ? "bg-emerald-500/20 text-emerald-400 font-bold border-l-2 border-emerald-500"
                    : "hover:bg-slate-800/50 text-slate-400"
                )}
              >
                {cat.name}
              </div>
            ))}
          </div>

          {/* Commands List */}
          <div className="flex-1 flex flex-col bg-slate-950">
            <div className="p-3 border-b border-emerald-500/10 flex items-center gap-3">
              <Search className="text-emerald-500/50" size={14} />
              <input
                placeholder="Search the legion archives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none text-emerald-100 placeholder:text-slate-700"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
              {filteredCommands?.map(cmd => (
                <div
                  key={cmd.name}
                  className="p-3 bg-slate-900/40 border border-emerald-500/10 hover:border-emerald-500/40 rounded-md group cursor-pointer transition-all hover:bg-emerald-500/5"
                  onClick={() => {
                    onExecute(cmd.syntax + '\n');
                    setIsOpen(false);
                  }}
                >
                  <div className="text-emerald-400 text-xs font-mono font-bold mb-1 group-hover:text-emerald-300 flex justify-between items-center">
                    <span className="truncate">{cmd.name}</span>
                    <Play size={10} className="opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
                  </div>
                  <div className="text-[9px] text-slate-500 leading-relaxed italic">{cmd.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
