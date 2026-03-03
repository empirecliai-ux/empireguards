import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class WslBridge {
  /**
   * Basic sanitization to prevent command injection
   */
  private static sanitize(path: string): string {
    // Remove characters that could be used for injection
    return path.replace(/[;&|`$]/g, '');
  }

  /**
   * Converts a Windows path to a WSL path (Async)
   */
  static async toWsl(windowsPath: string): Promise<string> {
    try {
      const sanitized = this.sanitize(windowsPath);
      const { stdout } = await execAsync(`wsl wslpath -u "${sanitized.replace(/\\/g, '/')}"`);
      return stdout.trim();
    } catch (e) {
      console.error('Path conversion to WSL failed:', e);
      return windowsPath;
    }
  }

  /**
   * Converts a WSL path to a Windows path (Async)
   */
  static async toWindows(wslPath: string): Promise<string> {
    try {
      const sanitized = this.sanitize(wslPath);
      const { stdout } = await execAsync(`wsl wslpath -w "${sanitized}"`);
      return stdout.trim();
    } catch (e) {
      console.error('Path conversion to Windows failed:', e);
      return wslPath;
    }
  }

  /**
   * Runs a command in WSL and returns the output (Async)
   */
  static async runInWsl(command: string): Promise<string> {
    const sanitized = this.sanitize(command);
    const { stdout } = await execAsync(`wsl ${sanitized}`);
    return stdout;
  }
}
