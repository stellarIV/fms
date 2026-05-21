import { config } from "dotenv";
config();
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";

async function main() {
  const email = "biruktml@gmail.com";
  // We don't have a direct way to use auth.api.signUpEmail without request in better-auth easily in a plain script,
  // Let's just create an API endpoint we can hit, or if they just want us to set the role, we update it.
  
  // check if user exists
  const existing = await db.select().from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    console.log("User exists, updating role to principal_middle...");
    await db.update(user).set({ role: "principal_middle" }).where(eq(user.email, email));
    console.log("Role updated!");
  } else {
    console.log("User does not exist. Please register the user via the frontend first, then run this script or API.");
  }
  process.exit(0);
}

main().catch(console.error);
