import { config } from "dotenv";
config();
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "luliali2244@gmail.com";
  
  const existing = await db.select().from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    console.log(`User ${email} exists, updating role to finance_head...`);
    await db.update(user).set({ role: "finance_head", name: "luli Ali" }).where(eq(user.email, email));
    console.log("Role updated successfully!");
  } else {
    console.log(`User ${email} does not exist. Inserting dummy user for testing...`);
    await db.insert(user).values({
      id: "finance_head_1",
      name: "luli Ali",
      email: email,
      emailVerified: false,
      role: "finance_head",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("User inserted. Note: This user has no password. To log in, please sign up with this email on the frontend, then re-run this script if needed.");
  }
  process.exit(0);
}

main().catch(console.error);
