import { getStudentPayments } from "@/app/actions/chapa";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

const MONTHS = ["Meskerem","Tikimt","Hidar","Tahsas","Tir","Yekatit","Megabit","Miyazia","Ginbot","Sene","Hamle","Nehase","Pagume"];

export default async function PaymentHistoryPage() {
  const result = await getStudentPayments();
  if (!result.success || !result.data) redirect("/login");

  const { payments } = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground mt-1">All your fee records across every month.</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Month</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Due</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Receipt</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const monthName = MONTHS[(p.month - 1)] || `Month ${p.month}`;
              const isPaid = (p.totalPayment || 0) >= (p.totalMonthlyFee || 0) && (p.totalPayment || 0) > 0;
              const hasBalance = (p.penaltyFee || 0) > 0;
              const isPending = (p.totalPayment || 0) === 0;
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{monthName} {p.year}</td>
                  <td className="px-4 py-3 text-right">{(p.totalMonthlyFee || 0).toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{(p.totalPayment || 0).toLocaleString()} ETB</td>
                  <td className={`px-4 py-3 text-right font-medium ${hasBalance ? "text-red-600" : "text-muted-foreground"}`}>
                    {(p.penaltyFee || 0).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.receiptNumber || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {isPaid ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>
                    ) : hasBalance ? (
                      <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Balance</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No payment records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
