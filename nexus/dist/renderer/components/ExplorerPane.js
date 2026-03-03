"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerPane = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_arborist_1 = require("react-arborist");
const lucide_react_1 = require("lucide-react");
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
const ExplorerPane = () => {
    const [data, setData] = (0, react_1.useState)([]);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    // Initial load
    (0, react_1.useEffect)(() => {
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
    const onToggle = async (id) => {
        const findAndRefetch = async (nodes) => {
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
    const onActivate = (node) => {
        if (node.data.isDirectory) {
            // Auto-cd in terminal
            window.electron.ptyWrite('term-1', `cd "${node.data.path}"\r`);
        }
    };
    const handleContextMenu = (e, node) => {
        e.preventDefault();
        window.electron.showContextMenu({ path: node.path, isDirectory: node.isDirectory });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col bg-slate-900/40 text-slate-300 select-none overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 flex flex-col gap-3 border-b border-emerald-500/20 bg-slate-900/60", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsxs)("div", { className: "empire-header flex items-center gap-2 text-[10px]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HardDrive, { size: 12, className: "text-emerald-500" }), (0, jsx_runtime_1.jsx)("span", { children: "Intelligence Assets" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "relative group", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search legion...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full bg-slate-950 border border-emerald-500/20 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-emerald-500/50 transition-all placeholder:opacity-30 group-hover:border-emerald-500/30" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-emerald-500/20 group-focus-within:bg-emerald-500 group-focus-within:animate-pulse" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-auto p-2 font-mono text-[11px] custom-scrollbar", children: (0, jsx_runtime_1.jsx)(react_arborist_1.Tree, { data: data, searchTerm: searchTerm, searchMatch: (node, term) => node.data.name.toLowerCase().includes(term.toLowerCase()), width: 280, height: 600, indent: 12, rowHeight: 26, onActivate: onActivate, onToggle: onToggle, children: ({ node, style, dragHandle }) => ((0, jsx_runtime_1.jsxs)("div", { style: style, ref: dragHandle, className: cn("flex items-center gap-2 px-2 rounded cursor-pointer group transition-all m-0.5", node.isSelected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.1)]" : "hover:bg-slate-800/50 border border-transparent"), onContextMenu: (e) => handleContextMenu(e, node.data), children: [(0, jsx_runtime_1.jsx)("span", { className: "opacity-40 group-hover:opacity-100 transition-opacity w-4 flex justify-center", children: node.data.isDirectory ? (node.isOpen ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { size: 12 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 12 })) : null }), (0, jsx_runtime_1.jsx)("span", { children: node.data.isDirectory ? ((0, jsx_runtime_1.jsx)(lucide_react_1.Folder, { size: 14, className: cn("text-emerald-600 transition-colors", node.isOpen && "text-emerald-400") })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.File, { size: 14, className: "text-slate-600 group-hover:text-slate-400" })) }), (0, jsx_runtime_1.jsx)("span", { className: cn("truncate flex-1", node.isSelected && "font-bold"), children: node.data.name })] })) }) })] }));
};
exports.ExplorerPane = ExplorerPane;
