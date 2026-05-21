import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS "daily_report" (
      "id" text PRIMARY KEY,
      "reportDate" timestamp NOT NULL,
      "reporterEmail" text NOT NULL,
      "csvData" text NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `;
  console.log('✓ daily_report table created (or already exists).');
}

run().catch(console.error);
