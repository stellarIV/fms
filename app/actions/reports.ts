"use server";

import { db } from "@/db";
import { dailyReport } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

function parseDataRows(csv: string): string[] {
  const lines = csv.split("\n");
  const dataLines: string[] = [];
  let inTotals = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Stop collecting rows once we hit the totals section
    if (line.includes('"TOTALS"') || line.includes('"Total Tuition Revenue"') || line.includes('"GRAND TOTAL REVENUE"')) {
      inTotals = true;
    }
    if (!inTotals) {
      dataLines.push(line);
    }
  }
  return dataLines;
}

function extractReceiptAndBuyer(csvRow: string): string {
  // Key is eNumber + ItemDescription + BuyerName (cols 0, 1, and 3)
  // Must include the description so each fee line (Registration, Transport, Tuition, Penalty)
  // is treated as a separate entry — otherwise all lines for one student collapse into one.
  const cols = csvRow.split('","');
  const eNumber = cols[0]?.replace(/^"|"$/g, "").trim() || "";
  const description = cols[1]?.replace(/^"|"$/g, "").trim() || "";
  const buyerName = cols[3]?.replace(/^"|"$/g, "").trim() || "";
  return `${eNumber}||${description}||${buyerName}`;
}

export async function saveDailyReport(newCsvContent: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing report for today
    const existing = await db.query.dailyReport.findFirst({
      where: sql`DATE("reportDate") = DATE(${today.toISOString()})`,
    });

    let finalCsvContent = newCsvContent;

    if (existing) {
      // Parse existing rows into a map keyed by receipt+description+buyer
      const existingRows = parseDataRows(existing.csvData);
      const existingMap = new Map<string, string>();
      for (const row of existingRows) {
        const key = extractReceiptAndBuyer(row);
        // Skip blank separator rows (all cols empty)
        if (key === "||||") continue;
        existingMap.set(key, row);
      }

      // Parse new rows — new ones take precedence
      const newRows = parseDataRows(newCsvContent);
      const newMap = new Map<string, string>();
      for (const row of newRows) {
        const key = extractReceiptAndBuyer(row);
        if (key === "||||") continue;
        newMap.set(key, row);
      }

      // Merge: start with existing, override/add from new
      for (const [key, row] of newMap) {
        existingMap.set(key, row);
      }

      // Rebuild totals from merged rows
      let totalTuition = 0, totalTransport = 0, totalRegistration = 0, totalPenalty = 0, totalOverall = 0;
      const mergedRows = Array.from(existingMap.values());
      for (const row of mergedRows) {
        const cols = row.split('","');
        const description = cols[1]?.replace(/^"|"$/g, "").trim() || "";
        const amount = parseFloat(cols[4]?.replace(/^"|"$/g, "").trim() || "0");
        if (isNaN(amount)) continue;
        totalOverall += amount;
        if (description === "Registration Fee") totalRegistration += amount;
        else if (description.includes("Serv.")) totalTransport += amount;
        else if (description.includes("Penalty") || description.includes("Other")) totalPenalty += amount;
        else totalTuition += amount;
      }

      const headerLine = newCsvContent.split("\n")[0];
      const totalRows = [
        ["", "", "", "", ""],
        ["", "TOTALS", "", "", ""],
        ["", "Total Tuition Revenue", "", "", totalTuition.toFixed(2)],
        ["", "Total Service/Transport Revenue", "", "", totalTransport.toFixed(2)],
        ["", "Total Registration Revenue", "", "", totalRegistration.toFixed(2)],
        ["", "Total Penalty/Other Revenue", "", "", totalPenalty.toFixed(2)],
        ["", "GRAND TOTAL REVENUE", "", "", totalOverall.toFixed(2)],
      ];

      finalCsvContent = [
        headerLine,
        ...mergedRows,
        ...totalRows.map(r => r.map(c => `"${c}"`).join(",")),
      ].join("\n");

      await db.update(dailyReport)
        .set({
          csvData: finalCsvContent,
          reporterEmail: session.user.email,
          reporterName: session.user.name,
          updatedAt: new Date(),
        })
        .where(eq(dailyReport.id, existing.id));
    } else {
      await db.insert(dailyReport).values({
        id: randomUUID(),
        reportDate: today,
        reporterEmail: session.user.email,
        reporterName: session.user.name,
        csvData: finalCsvContent,
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getTodaysCumulativeReport(): Promise<{ csvData: string | null; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return { csvData: null, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = await db.query.dailyReport.findFirst({
      where: sql`DATE("reportDate") = DATE(${today.toISOString()})`,
    });

    return { csvData: report?.csvData ?? null };
  } catch (err) {
    return { csvData: null, error: err instanceof Error ? err.message : String(err) };
  }
}
