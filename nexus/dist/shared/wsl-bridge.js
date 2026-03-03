"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WslBridge = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class WslBridge {
    /**
     * Basic sanitization to prevent command injection
     */
    static sanitize(path) {
        // Remove characters that could be used for injection
        return path.replace(/[;&|`$]/g, '');
    }
    /**
     * Converts a Windows path to a WSL path (Async)
     */
    static async toWsl(windowsPath) {
        try {
            const sanitized = this.sanitize(windowsPath);
            const { stdout } = await execAsync(`wsl wslpath -u "${sanitized.replace(/\\/g, '/')}"`);
            return stdout.trim();
        }
        catch (e) {
            console.error('Path conversion to WSL failed:', e);
            return windowsPath;
        }
    }
    /**
     * Converts a WSL path to a Windows path (Async)
     */
    static async toWindows(wslPath) {
        try {
            const sanitized = this.sanitize(wslPath);
            const { stdout } = await execAsync(`wsl wslpath -w "${sanitized}"`);
            return stdout.trim();
        }
        catch (e) {
            console.error('Path conversion to Windows failed:', e);
            return wslPath;
        }
    }
    /**
     * Runs a command in WSL and returns the output (Async)
     */
    static async runInWsl(command) {
        const sanitized = this.sanitize(command);
        const { stdout } = await execAsync(`wsl ${sanitized}`);
        return stdout;
    }
}
exports.WslBridge = WslBridge;
