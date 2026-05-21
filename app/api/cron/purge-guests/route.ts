import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { lt, and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  // It is recommended to secure this endpoint using a cron secret
  // For example: if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const deletedUsers = await db
      .delete(user)
      .where(
        and(
          eq(user.role, "guest"),
          lt(user.createdAt, oneDayAgo)
        )
      )
      .returning({ id: user.id });

    return NextResponse.json({ success: true, purgedCount: deletedUsers.length });
  } catch (error) {
    console.error("Failed to purge guests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
