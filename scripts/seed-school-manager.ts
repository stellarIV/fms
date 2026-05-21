import { config } from "dotenv";
config();
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "schoolmanager@hmmschool.edu.et";
  const name = "School Manager";

  const existing = await db.select().from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    console.log(`User ${email} exists, updating role to school_manager...`);
    await db.update(user).set({ role: "school_manager", name }).where(eq(user.email, email));
    console.log("✓ Role updated to school_manager.");
  } else {
    console.log(`User ${email} not found. Creating...`);
    await db.insert(user).values({
      id: "school_manager_1",
      name,
      email,
      emailVerified: false,
      role: "school_manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✓ User created with email: ${email}`);
    console.log("  → Sign up on the frontend with this email to set a password, then re-run this script to confirm role.");
  }
  process.exit(0);
}

main().catch(console.error);
