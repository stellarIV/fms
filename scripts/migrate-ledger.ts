import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set in environment variables!");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration() {
  console.log("Starting database migration for Budget & General Ledger tables...");

  try {
    // 1. Create budget table
    console.log("Creating 'budget' table if not exists...");
    await sql`
      CREATE TABLE IF NOT EXISTS "budget" (
        "id" text PRIMARY KEY,
        "category" text NOT NULL,
        "allocated" double precision NOT NULL DEFAULT 0,
        "year" integer NOT NULL DEFAULT 2026,
        "createdAt" timestamp NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp NOT NULL DEFAULT NOW()
      );
    `;
    console.log("'budget' table created successfully.");

    // 2. Create manual_journal_entry table
    console.log("Creating 'manual_journal_entry' table if not exists...");
    await sql`
      CREATE TABLE IF NOT EXISTS "manual_journal_entry" (
        "id" text PRIMARY KEY,
        "date" timestamp NOT NULL DEFAULT NOW(),
        "description" text NOT NULL,
        "accountCode" text NOT NULL,
        "debit" double precision NOT NULL DEFAULT 0,
        "credit" double precision NOT NULL DEFAULT 0,
        "reference" text,
        "createdAt" timestamp NOT NULL DEFAULT NOW()
      );
    `;
    console.log("'manual_journal_entry' table created successfully.");

    console.log("Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
