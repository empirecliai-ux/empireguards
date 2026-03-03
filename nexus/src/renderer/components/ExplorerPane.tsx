import React, { useState, useEffect } from 'react';
import { Tree } from 'react-arborist';
import { Folder, File, ChevronRight, ChevronDown, HardDrive } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  isLoaded?: boolean;
}

export const ExplorerPane: React.FC = () => {
  const [data, setData] = useState<FileNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      const rootPath = "/"; // Better starting point for WSL usually, or process.cwd()
      const nodes = await window.electron.readDir(rootPath);
      setData([{
        id: rootPath,
        name: 'empire-nexus',
        path: rootPath,
        isDirectory: true,
        children: nodes,
        isLoaded: true
      }]);
    };
    loadInitial();
  }, []);

  const onToggle = async (id: string) => {
    const findAndRefetch = async (nodes: FileNode[]): Promise<FileNode[]> => {
      return Promise.all(nodes.map(async (node) => {
        if (node.id === id && node.isDirectory && !node.isLoaded) {
          const children = await window.electron.readDir(node.path);
          return { ...node, children, isLoaded: true };
        }
        if (node.children) {
          return { ...node, children: await findAndRefetch(node.children) };
        }
        return node;
      }));
    };

    const newData = await findAndRefetch(data);
    setData(newData);
  };

  const onActivate = (node: any) => {
    if (node.data.isDirectory) {
      // Auto-cd in terminal
      window.electron.ptyWrite('term-1', `cd "${node.data.path}"\r`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    window.electron.showContextMenu({ path: node.path, isDirectory: node.isDirectory });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900/40 text-slate-300 select-none overflow-hidden">
      <div className="p-4 flex flex-col gap-3 border-b border-emerald-500/20 bg-slate-900/60">
        <div className="flex items-center justify-between">
           <div className="empire-header flex items-center gap-2 text-[10px]">
             <HardDrive size={12} className="text-emerald-500" />
             <span>Intelligence Assets</span>
           </div>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Search legion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-emerald-500/20 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-emerald-500/50 transition-all placeholder:opacity-30 group-hover:border-emerald-500/30"
          />
          <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-emerald-500/20 group-focus-within:bg-emerald-500 group-focus-within:animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-[11px] custom-scrollbar">
        <Tree
          data={data}
          searchTerm={searchTerm}
          searchMatch={(node, term) => node.data.name.toLowerCase().includes(term.toLowerCase())}
          width={280}
          height={600}
          indent={12}
          rowHeight={26}
          onActivate={onActivate}
          onToggle={onToggle}
        >
          {({ node, style, dragHandle }) => (
            <div
              style={style}
              ref={dragHandle}
              className={cn(
                "flex items-center gap-2 px-2 rounded cursor-pointer group transition-all m-0.5",
                node.isSelected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.1)]" : "hover:bg-slate-800/50 border border-transparent"
              )}
              onContextMenu={(e) => handleContextMenu(e, node.data)}
            >
              <span className="opacity-40 group-hover:opacity-100 transition-opacity w-4 flex justify-center">
                {node.data.isDirectory ? (
                  node.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                ) : null}
              </span>
              <span>
                {node.data.isDirectory ? (
                  <Folder size={14} className={cn("text-emerald-600 transition-colors", node.isOpen && "text-emerald-400")} />
                ) : (
                  <File size={14} className="text-slate-600 group-hover:text-slate-400" />
                )}
              </span>
              <span className={cn("truncate flex-1", node.isSelected && "font-bold")}>{node.data.name}</span>
            </div>
          )}
        </Tree>
      </div>
    </div>
  );
};
