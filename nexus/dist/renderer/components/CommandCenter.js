"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandCenter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const commands_1 = require("../../config/commands");
const lucide_react_1 = require("lucide-react");
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
const CommandCenter = ({ onExecute }) => {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [activeCategory, setActiveCategory] = (0, react_1.useState)(commands_1.COMMAND_CATEGORIES[0].name);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const filteredCommands = commands_1.COMMAND_CATEGORIES.find(c => c.name === activeCategory)?.commands.filter(cmd => cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.desc.toLowerCase().includes(searchTerm.toLowerCase()));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 rounded-md text-xs transition-all font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Terminal, { size: 14 }), "Command Nexus", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { size: 14, className: cn("transition-transform", isOpen && "rotate-180") })] }), isOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute top-12 right-0 w-[650px] bg-slate-950 border border-emerald-500/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 flex h-[450px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-52 bg-slate-900/50 border-r border-emerald-500/20 p-2 overflow-y-auto", children: [(0, jsx_runtime_1.jsx)("div", { className: "empire-header text-[9px] px-2 mb-2 opacity-50", children: "Intelligence Categories" }), commands_1.COMMAND_CATEGORIES.map(cat => ((0, jsx_runtime_1.jsx)("div", { onClick: () => setActiveCategory(cat.name), className: cn("p-2 text-[10px] cursor-pointer rounded mb-1 transition-all flex items-center gap-2", activeCategory === cat.name
                                    ? "bg-emerald-500/20 text-emerald-400 font-bold border-l-2 border-emerald-500"
                                    : "hover:bg-slate-800/50 text-slate-400"), children: cat.name }, cat.name)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col bg-slate-950", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3 border-b border-emerald-500/10 flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "text-emerald-500/50", size: 14 }), (0, jsx_runtime_1.jsx)("input", { placeholder: "Search the legion archives...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "flex-1 bg-transparent text-xs outline-none text-emerald-100 placeholder:text-slate-700" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start", children: filteredCommands?.map(cmd => ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-slate-900/40 border border-emerald-500/10 hover:border-emerald-500/40 rounded-md group cursor-pointer transition-all hover:bg-emerald-500/5", onClick: () => {
                                        onExecute(cmd.syntax + '\n');
                                        setIsOpen(false);
                                    }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-emerald-400 text-xs font-mono font-bold mb-1 group-hover:text-emerald-300 flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("span", { className: "truncate", children: cmd.name }), (0, jsx_runtime_1.jsx)(lucide_react_1.Play, { size: 10, className: "opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-[9px] text-slate-500 leading-relaxed italic", children: cmd.desc })] }, cmd.name))) })] })] }))] }));
};
exports.CommandCenter = CommandCenter;
