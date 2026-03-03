"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHotkeys = void 0;
const react_1 = require("react");
const useHotkeys = () => {
    (0, react_1.useEffect)(() => {
        const handlePasswordVault = () => {
            const description = prompt('Enter password description (max 60 chars):');
            if (description) {
                const password = prompt('Enter password:');
                if (password) {
                    window.electron.savePassword({ description, password });
                    alert('Password secured in Empire Vault.');
                }
            }
        };
        const cleanupVault = window.electron.onOpenPasswordVault(handlePasswordVault);
        return () => {
            cleanupVault();
        };
    }, []);
};
exports.useHotkeys = useHotkeys;
