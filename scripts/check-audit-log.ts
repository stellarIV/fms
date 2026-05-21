import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function checkAuditLog() {
  console.log('--- Checking audit_log table ---');
  const rows = await sql`SELECT * FROM audit_log ORDER BY "createdAt" DESC LIMIT 10`;
  console.log(`Found ${rows.length} rows:`);
  for (const row of rows) {
    console.log(row);
  }

  console.log('\n--- Checking table structure ---');
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'audit_log'
    ORDER BY ordinal_position
  `;
  console.log('Columns:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
}

checkAuditLog().catch(console.error);
