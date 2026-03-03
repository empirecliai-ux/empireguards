import SQLite from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';

interface SavedCommand {
  id?: number;
  full_command: string;
  command_only: string;
  path: string;
  summary: string;
  category?: string;
  created_at?: string;
}

const ENCRYPTION_KEY = process.env.EMPIRE_VAULT_KEY;
const IV_LENGTH = 12; // GCM uses 12-byte IV

export class CommandStore {
  private db: SQLite.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'empire_commands.db');
    this.db = new SQLite(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_command TEXT,
        command_only TEXT,
        path TEXT,
        summary TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS secure_vault (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        encrypted_password TEXT,
        iv TEXT,
        tag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private encrypt(text: string): { iv: string, encrypted: string, tag: string } {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      throw new Error('EMPIRE_VAULT_KEY environment variable must be exactly 32 bytes');
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return { iv: iv.toString('hex'), encrypted, tag };
  }

  saveCommand(cmd: SavedCommand) {
    const stmt = this.db.prepare(`
      INSERT INTO commands (full_command, command_only, path, summary, category)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(cmd.full_command, cmd.command_only, cmd.path, cmd.summary, cmd.category);
  }

  savePassword(description: string, password: string) {
    const { iv, encrypted, tag } = this.encrypt(password);
    const stmt = this.db.prepare(`
      INSERT INTO secure_vault (description, encrypted_password, iv, tag)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(description, encrypted, iv, tag);
  }

  getRecentCommands(limit = 60) {
    return this.db.prepare('SELECT * FROM commands ORDER BY created_at DESC LIMIT ?').all(limit);
  }
}
