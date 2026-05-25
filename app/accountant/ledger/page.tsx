import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFinancialStatementsAction, getGeneralLedgerAction } from "@/app/actions/financials";
import { FinancialLedgerDashboard } from "@/components/financial-ledger-dashboard";

export default async function AccountantLedgerPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "accountant") {
    redirect("/login");
  }

  const year = 2018; // Default Ethiopian Calendar Year Meskerem 2018 E.C.
  
  const statementsResult = await getFinancialStatementsAction(year);
  const ledgerResult = await getGeneralLedgerAction(year);

  if (!statementsResult.success || !statementsResult.data || !ledgerResult.success || !ledgerResult.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-card border rounded-lg max-w-md mx-auto mt-12 shadow-sm">
        <h2 className="text-lg font-bold text-red-500">Financial Ledger Unavailable</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          The school's dynamic general ledger, trial balance, and operating statement could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <FinancialLedgerDashboard 
      statements={statementsResult.data} 
      ledger={ledgerResult.data} 
      initialYear={year}
      userRole={session.user.role}
    />
  );
}
