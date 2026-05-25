import { NextRequest, NextResponse } from "next/server";
import { verifyChapaPayment } from "@/app/actions/chapa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const txRef = body.tx_ref;
    if (!txRef) return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });

    const result = await verifyChapaPayment(txRef);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const txRef = req.nextUrl.searchParams.get("trx_ref") || req.nextUrl.searchParams.get("tx_ref");
  if (!txRef) return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });

  const result = await verifyChapaPayment(txRef);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.redirect(new URL(`/student/payment/success?tx_ref=${txRef}`, req.url));
}
