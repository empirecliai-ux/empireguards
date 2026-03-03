import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Share2, Zap } from 'lucide-react';

interface QrGeneratorProps {
  currentPath: string;
  onClose: () => void;
}

export const QrGenerator: React.FC<QrGeneratorProps> = ({ currentPath, onClose }) => {
  const [mode, setMode] = useState<'path' | 'station' | 'lateral'>('path');
  const [customPath, setCustomPath] = useState(currentPath);
  const [command, setCommand] = useState('');

  const generateValue = () => {
    switch (mode) {
      case 'station':
        return `RUN_STATION:${customPath}>${command}`;
      case 'lateral':
        return `RUN_LATERAL:cd ${customPath} && ${command}`;
      case 'path':
      default:
        return `PATH:${customPath}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-[450px] overflow-hidden animate-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-emerald-500 font-bold flex items-center gap-2 text-sm uppercase tracking-tighter">
            <Zap size={16} /> Empire QR Generator
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          <div className="bg-white p-3 rounded-lg shadow-lg shadow-emerald-500/10">
            <QRCodeSVG value={generateValue()} size={200} level="H" />
          </div>

          <div className="w-full flex bg-slate-950 rounded-lg p-1 border border-slate-800">
            {(['path', 'station', 'lateral'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${
                  mode === m ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'path' ? 'Path Only' : m === 'station' ? 'Station Run' : 'Lateral Run'}
              </button>
            ))}
          </div>

          <div className="w-full space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Location Path</label>
              <input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500"
                placeholder="/mnt/c/..."
              />
            </div>

            {mode !== 'path' && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Command to Execute</label>
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500"
                  placeholder="npm run dev..."
                />
              </div>
            )}
          </div>

          <div className="w-full flex gap-2">
            <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2">
              <Copy size={14} /> Copy Value
            </button>
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
              <Share2 size={14} /> Share QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
