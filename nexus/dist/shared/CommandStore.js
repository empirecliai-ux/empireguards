"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandStore = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.EMPIRE_VAULT_KEY;
const IV_LENGTH = 12; // GCM uses 12-byte IV
class CommandStore {
    db;
    constructor() {
        const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'empire_commands.db');
        this.db = new better_sqlite3_1.default(dbPath);
        this.init();
    }
    init() {
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
    encrypt(text) {
        if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
            throw new Error('EMPIRE_VAULT_KEY environment variable must be exactly 32 bytes');
        }
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag().toString('hex');
        return { iv: iv.toString('hex'), encrypted, tag };
    }
    saveCommand(cmd) {
        const stmt = this.db.prepare(`
      INSERT INTO commands (full_command, command_only, path, summary, category)
      VALUES (?, ?, ?, ?, ?)
    `);
        return stmt.run(cmd.full_command, cmd.command_only, cmd.path, cmd.summary, cmd.category);
    }
    savePassword(description, password) {
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
exports.CommandStore = CommandStore;
