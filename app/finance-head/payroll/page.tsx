import { getPayrollEmployees } from "@/app/actions/payroll-chapa";
import { PayrollPayClient } from "./payroll-pay-client";

export default async function FinanceHeadPayrollPage() {
  const employees = await getPayrollEmployees();
  const total = employees.reduce((sum, e) => sum + (e.receivable || 0), 0);

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Disbursement</h1>
          <p className="text-muted-foreground mt-1">
            Send salaries to all employees via Chapa bank transfer.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Payroll</p>
          <p className="text-2xl font-bold">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</p>
          <p className="text-xs text-muted-foreground">{employees.length} employees</p>
        </div>
      </div>
      <PayrollPayClient employees={employees} />
    </div>
  );
}
