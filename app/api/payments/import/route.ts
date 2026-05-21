import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyPayment, student } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { DEFAULT_FEES } from "@/lib/constants";



// Expected CSV columns: paymentCode, amount, bankDate (YYYY-MM-DD), month, year
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryMonth = searchParams.get("month");
    const queryYear = searchParams.get("year");

    const body = await req.text();
    const lines = body.trim().split("\n");
    
    const parseCsvLine = (line: string) => {
      const row = [];
      let inQuotes = false;
      let val = "";
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
          row.push(val.trim().replace(/^"|"$/g, ''));
          val = "";
        } else {
          val += line[i];
        }
      }
      row.push(val.trim().replace(/^"|"$/g, ''));
      return row;
    };

    const headerLine = lines[0].toLowerCase().replace(/\r/g, "");
    const cols = parseCsvLine(headerLine);

    const colIndex = (names: string[]) => {
      for (const name of names) {
        const idx = cols.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const pcIdx = colIndex(["payment code", "paymentcode", "student number", "studentnumber"]);
    const amtIdx = colIndex(["total payment", "amount", "credit"]);
    const dateIdx = colIndex(["bank date", "bankdate", "date"]);
    const monthIdx = colIndex(["month"]);
    const yearIdx = colIndex(["year"]);
    const receiptIdx = colIndex(["receipt number", "receiptnumber", "reference"]);

    if (pcIdx === -1 || amtIdx === -1) {
      return NextResponse.json({ 
        error: "CSV must have at least 'Payment Code' and 'Total Payment' columns." 
      }, { status: 400 });
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i].replace(/\r/g, ""));
      if (row.length < 2) continue;

      const paymentCode = row[pcIdx]?.trim();
      const rawAmount = row[amtIdx]?.trim() || "0";
      const amount = parseFloat(rawAmount.replace(/,/g, ''));
      const bankDateRaw = dateIdx !== -1 ? row[dateIdx]?.trim() : null;
      const month = parseInt(monthIdx !== -1 && row[monthIdx] ? row[monthIdx]?.trim() : (queryMonth || "1"));
      const year = parseInt(yearIdx !== -1 && row[yearIdx] ? row[yearIdx]?.trim() : (queryYear || "2017"));
      const receiptNumber = receiptIdx !== -1 ? row[receiptIdx]?.trim() : null;

      if (!paymentCode || isNaN(amount) || isNaN(month) || isNaN(year)) {
        results.errors.push(`Row ${i + 1}: Missing required data (Payment Code, Amount, Month, or Year)`);
        continue;
      }

      const bankDate = bankDateRaw ? new Date(bankDateRaw) : new Date();

      // Find student by payment code (case-insensitive)
      const s = await db.query.student.findFirst({ 
        where: sql`LOWER(${student.paymentCode}) = LOWER(${paymentCode})` 
      });
      if (!s) {
        results.errors.push(`Row ${i + 1}: No student with paymentCode "${paymentCode}"`);
        continue;
      }

      // Get or create payment record
      let payment = await db.query.monthlyPayment.findFirst({
        where: and(
          eq(monthlyPayment.studentId, s.id),
          eq(monthlyPayment.month, month),
          eq(monthlyPayment.year, year)
        ),
      });

      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevPayment = await db.query.monthlyPayment.findFirst({
        where: and(
          eq(monthlyPayment.studentId, s.id),
          eq(monthlyPayment.month, prevMonth),
          eq(monthlyPayment.year, prevYear)
        ),
      });

      const prevPending = 0; 
      const regFee = month === 1 && !s.isRegistrationPaid ? DEFAULT_FEES.registration : 0;
      
      const usesTransport = parseInt(s.paymentCode.replace(/\D/g, "") || "1", 10) % 3 !== 0;
      const transport = payment ? payment.transportFee : (usesTransport ? DEFAULT_FEES.transport : 0);
      const tuition = DEFAULT_FEES.tuition;
      const totalMonthlyFee = prevPending + regFee + transport + tuition;
      
      const existingPaymentAmt = payment ? payment.totalPayment : 0;
      const newTotalPayment = existingPaymentAmt + amount;

      let penaltyFee = newTotalPayment === 0 ? 0 : newTotalPayment - totalMonthlyFee;

      if (payment) {
        await db.update(monthlyPayment).set({
          totalPayment: newTotalPayment,
          bankDate,
          penaltyFee,
          totalMonthlyFee,
          pendingFee: 0,
          registrationFee: regFee,
          receiptNumber: receiptNumber || payment.receiptNumber,
          updatedAt: new Date(),
        }).where(eq(monthlyPayment.id, payment.id));
        results.updated++;
      } else {
        await db.insert(monthlyPayment).values({
          id: randomUUID(),
          studentId: s.id,
          month,
          year,
          prevPending,
          registrationFee: regFee,
          tuitionFee: tuition,
          transportFee: transport,
          penaltyFee,
          totalMonthlyFee,
          totalPayment: newTotalPayment,
          pendingFee: 0,
          receiptNumber,
          bankDate,
        });
        results.created++;
      }

      // Mark registration paid if covered
      if (regFee > 0 && amount >= regFee) {
        await db.update(student)
          .set({ isRegistrationPaid: true, updatedAt: new Date() })
          .where(eq(student.id, s.id));
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
