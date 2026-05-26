import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFinancialStatementsAction, getGeneralLedgerAction } from "@/app/actions/financials";
import { FinancialLedgerDashboard } from "@/components/financial-ledger-dashboard";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function SchoolManagerBudgetPage(props: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "school_manager") {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const year = parseInt(searchParams.year || "2018");
  
  const statementsResult = await getFinancialStatementsAction(year);
  const ledgerResult = await getGeneralLedgerAction(year);

  if (!statementsResult.success || !statementsResult.data || !ledgerResult.success || !ledgerResult.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-card border rounded-lg max-w-md mx-auto mt-12 shadow-sm">
        <h2 className="text-lg font-bold text-red-500">Financial Data Unavailable</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          The General Ledger aggregated tables or budgets could not be compiled at this time. Please contact school administration.
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
