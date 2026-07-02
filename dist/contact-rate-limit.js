"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContactSubmission = exports.recordContactSubmission = exports.checkContactRateLimit = void 0;
const client_1 = require("@libsql/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const RATE_LIMIT_SECONDS = 5 * 60;
const dataDir = path_1.default.resolve(__dirname, "../data");
const dbPath = path_1.default.join(dataDir, "contact-rate-limit.db");
if (!process.env.TURSO_DATABASE_URL && !fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const client = (0, client_1.createClient)({
    url: process.env.TURSO_DATABASE_URL || `file:${dbPath}`,
    authToken: process.env.TURSO_AUTH_TOKEN,
});
let initialized = false;
function ensureInitialized() {
    return __awaiter(this, void 0, void 0, function* () {
        if (initialized) {
            return;
        }
        yield client.execute(`
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);
        yield client.execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_ip
        ON contact_submissions(ip, created_at)
    `);
        yield client.execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_email
        ON contact_submissions(email, created_at)
    `);
        initialized = true;
    });
}
function checkContactRateLimit(ip, email) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureInitialized();
        const normalizedEmail = email.trim().toLowerCase();
        const result = yield client.execute({
            sql: `
            SELECT created_at
            FROM contact_submissions
            WHERE (ip = ? OR email = ?)
              AND datetime(created_at) > datetime('now', ?)
            ORDER BY created_at DESC
            LIMIT 1
        `,
            args: [ip, normalizedEmail, `-${RATE_LIMIT_SECONDS} seconds`],
        });
        if (result.rows.length === 0) {
            return { allowed: true };
        }
        const createdAt = String(result.rows[0].created_at);
        const createdAtMs = Date.parse(`${createdAt}Z`);
        const elapsedSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
        const retryAfterSeconds = Math.max(1, RATE_LIMIT_SECONDS - elapsedSeconds);
        return {
            allowed: false,
            retryAfterSeconds,
        };
    });
}
exports.checkContactRateLimit = checkContactRateLimit;
function recordContactSubmission(ip, email) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureInitialized();
        const normalizedEmail = email.trim().toLowerCase();
        const result = yield client.execute({
            sql: `
            INSERT INTO contact_submissions (ip, email)
            VALUES (?, ?)
        `,
            args: [ip, normalizedEmail],
        });
        return Number(result.lastInsertRowid);
    });
}
exports.recordContactSubmission = recordContactSubmission;
function deleteContactSubmission(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureInitialized();
        yield client.execute({
            sql: "DELETE FROM contact_submissions WHERE id = ?",
            args: [id],
        });
    });
}
exports.deleteContactSubmission = deleteContactSubmission;
