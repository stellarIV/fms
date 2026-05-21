import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { student } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const students = await db.select().from(student);
    return NextResponse.json(students);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { rollNo, name, paymentCode } = body;

    if (!rollNo || !name || !paymentCode) {
      return NextResponse.json({ error: "rollNo, name, and paymentCode are required" }, { status: 400 });
    }

    const [newStudent] = await db
      .insert(student)
      .values({ id: randomUUID(), rollNo, name, paymentCode })
      .returning();

    return NextResponse.json(newStudent, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
