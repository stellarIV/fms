import { db } from "@/db";
import { dailyReport } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { ReportsClient } from "@/app/accountant/revenue/reports/reports-client";

export default async function FinanceHeadReportsPage() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("Auth session fetch failed in reports page:", error);
  }
  
  if (!session) {
    return redirect("/login");
  }

  if (session.user.role !== "finance_head") {
    return redirect("/dashboard");
  }

  const reports = await db.query.dailyReport.findMany({
    orderBy: [desc(dailyReport.reportDate)],
  });

  return (
    <div className="flex flex-col gap-4 w-full p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
        <p className="text-sm text-muted-foreground">
          View and download auto-generated daily transaction reports.
        </p>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <ReportsClient initialReports={reports} readOnlyMode={true} />
      </div>
    </div>
  );
}
