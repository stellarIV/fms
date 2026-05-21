import { config } from "dotenv";
config({ path: ".env" });
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "luliali2244@gmail.com";
  console.log(`Deleting user ${email} to allow proper registration...`);
  await db.delete(user).where(eq(user.email, email));
  console.log("User deleted successfully!");
  process.exit(0);
}

main().catch(console.error);
