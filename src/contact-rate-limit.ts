import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const RATE_LIMIT_SECONDS = 5 * 60;

const dataDir = path.resolve(__dirname, "../data");
const dbPath = path.join(dataDir, "contact-rate-limit.db");

if (!process.env.TURSO_DATABASE_URL && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || `file:${dbPath}`,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

let initialized = false;

async function ensureInitialized() {
    if (initialized) {
        return;
    }

    await client.execute(`
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);
    await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_ip
        ON contact_submissions(ip, created_at)
    `);
    await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_contact_email
        ON contact_submissions(email, created_at)
    `);

    initialized = true;
}

export type RateLimitResult =
    | { allowed: true }
    | { allowed: false; retryAfterSeconds: number };

export async function checkContactRateLimit(
    ip: string,
    email: string,
): Promise<RateLimitResult> {
    await ensureInitialized();

    const normalizedEmail = email.trim().toLowerCase();
    const result = await client.execute({
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
}

export async function recordContactSubmission(
    ip: string,
    email: string,
): Promise<number> {
    await ensureInitialized();

    const normalizedEmail = email.trim().toLowerCase();
    const result = await client.execute({
        sql: `
            INSERT INTO contact_submissions (ip, email)
            VALUES (?, ?)
        `,
        args: [ip, normalizedEmail],
    });

    return Number(result.lastInsertRowid);
}

export async function deleteContactSubmission(id: number): Promise<void> {
    await ensureInitialized();

    await client.execute({
        sql: "DELETE FROM contact_submissions WHERE id = ?",
        args: [id],
    });
}
