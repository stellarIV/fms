import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function createExpenseRequestTable() {
  console.log('Creating expense_request table...');
  await sql`
    CREATE TABLE IF NOT EXISTS "expense_request" (
      "id" text PRIMARY KEY NOT NULL,
      "no" integer NOT NULL UNIQUE,
      "objectType" text NOT NULL,
      "objectDescription" text NOT NULL,
      "measure" text NOT NULL,
      "requestPurpose" text NOT NULL,
      "quantity" integer NOT NULL,
      "evaluation" text,
      "status" text DEFAULT 'Draft' NOT NULL,
      "requesterId" text NOT NULL REFERENCES "user"("id"),
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `;

  console.log('✅ expense_request table created successfully!');

  // Verify
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'expense_request'
    ORDER BY ordinal_position
  `;
  console.log('Columns:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
}

createExpenseRequestTable().catch(console.error);
