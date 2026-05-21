import "dotenv/config";
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Searching for users with 'school-manager' role...");
  const usersToFix = await db.select().from(user).where(eq(user.role, "school-manager"));
  
  if (usersToFix.length === 0) {
    console.log("No users found with 'school-manager' role.");
  } else {
    console.log(`Found ${usersToFix.length} user(s). Updating to 'school_manager'...`);
    for (const u of usersToFix) {
      await db.update(user).set({ role: "school_manager" }).where(eq(user.id, u.id));
      console.log(`✓ Updated ${u.email}`);
    }
    console.log("All updates complete.");
  }
  process.exit(0);
}

main().catch(console.error);
