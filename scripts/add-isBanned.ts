import { config } from "dotenv";
config();
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`ALTER TABLE "user" ADD COLUMN "isBanned" boolean NOT NULL DEFAULT false;`;
    console.log("Column added");
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("Column already exists");
    } else {
      console.error(e);
    }
  }
}

main();
