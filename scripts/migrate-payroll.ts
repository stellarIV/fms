import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Optimizing database schema (adding unique constraint for performance)...");
  
  try {
    // Add unique constraint to 'no' column
    // First, let's just recreate the table to be sure, it's faster than ALTER in this script
    await sql`DROP TABLE IF EXISTS "payroll";`;
    
    await sql`
      CREATE TABLE "payroll" (
        "id" text PRIMARY KEY NOT NULL,
        "no" integer NOT NULL UNIQUE,
        "name" text NOT NULL,
        "position" text NOT NULL,
        "section" text NOT NULL,
        "basicSalary" double precision NOT NULL,
        "forPensionContributionDeductionPurpose" double precision NOT NULL,
        "accWorkingDate" double precision DEFAULT 30 NOT NULL,
        "allowanceForServiceAssistance" double precision DEFAULT 0 NOT NULL,
        "allowanceForOvertime" double precision DEFAULT 0 NOT NULL,
        "taxableIncome" double precision DEFAULT 0 NOT NULL,
        "grossSalary" double precision DEFAULT 0 NOT NULL,
        "receivable" double precision DEFAULT 0 NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Successfully optimized 'payroll' table with unique constraint.");
  } catch (error) {
    console.error("Error optimizing table:", error);
  }
}

main();
