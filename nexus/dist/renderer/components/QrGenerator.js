"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrGenerator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const qrcode_react_1 = require("qrcode.react");
const lucide_react_1 = require("lucide-react");
const QrGenerator = ({ currentPath, onClose }) => {
    const [mode, setMode] = (0, react_1.useState)('path');
    const [customPath, setCustomPath] = (0, react_1.useState)(currentPath);
    const [command, setCommand] = (0, react_1.useState)('');
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
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-[450px] overflow-hidden animate-in zoom-in duration-200", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-emerald-500 font-bold flex items-center gap-2 text-sm uppercase tracking-tighter", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 16 }), " Empire QR Generator"] }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "text-slate-500 hover:text-white transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 flex flex-col items-center gap-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white p-3 rounded-lg shadow-lg shadow-emerald-500/10", children: (0, jsx_runtime_1.jsx)(qrcode_react_1.QRCodeSVG, { value: generateValue(), size: 200, level: "H" }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex bg-slate-950 rounded-lg p-1 border border-slate-800", children: ['path', 'station', 'lateral'].map((m) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setMode(m), className: `flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${mode === m ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`, children: m === 'path' ? 'Path Only' : m === 'station' ? 'Station Run' : 'Lateral Run' }, m))) }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] text-slate-500 uppercase font-bold ml-1", children: "Location Path" }), (0, jsx_runtime_1.jsx)("input", { value: customPath, onChange: (e) => setCustomPath(e.target.value), className: "w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500", placeholder: "/mnt/c/..." })] }), mode !== 'path' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1 animate-in slide-in-from-top-2 duration-200", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] text-slate-500 uppercase font-bold ml-1", children: "Command to Execute" }), (0, jsx_runtime_1.jsx)("input", { value: command, onChange: (e) => setCommand(e.target.value), className: "w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500", placeholder: "npm run dev..." })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full flex gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { className: "flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { size: 14 }), " Copy Value"] }), (0, jsx_runtime_1.jsxs)("button", { className: "flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Share2, { size: 14 }), " Share QR"] })] })] })] }) }));
};
exports.QrGenerator = QrGenerator;
