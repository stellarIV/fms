import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function recreateAuditLogTable() {
  console.log('Dropping old audit_log table...');
  await sql`DROP TABLE IF EXISTS "audit_log"`;

  console.log('Creating audit_log table with correct schema...');
  await sql`
    CREATE TABLE "audit_log" (
      "id" text PRIMARY KEY NOT NULL,
      "changeDescription" text NOT NULL,
      "changerName" text NOT NULL,
      "changerRole" text NOT NULL,
      "employeeNo" integer NOT NULL,
      "fieldChanged" text NOT NULL,
      "oldValue" text NOT NULL,
      "newValue" text NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `;

  console.log('✅ audit_log table recreated successfully!');

  // Verify
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'audit_log'
    ORDER BY ordinal_position
  `;
  console.log('Columns:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
}

recreateAuditLogTable().catch(console.error);
