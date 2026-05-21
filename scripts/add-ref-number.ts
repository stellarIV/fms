import * as dotenv from "dotenv";
dotenv.config();
import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE manager_letter ADD COLUMN IF NOT EXISTS "refNumber" text`);
  console.log("✓ refNumber column added to manager_letter");
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
