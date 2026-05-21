import { getPendingExpenseRequestsAction, getApprovedExpenseRequestsAction } from "@/app/actions/purchase-orders";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PurchaseOrdersClient } from "./purchase-orders-client";

export default async function FinanceHeadOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "finance_head") redirect("/login");

  const pendingResponse = await getPendingExpenseRequestsAction();
  const pendingData = pendingResponse.success && pendingResponse.data ? pendingResponse.data : [];

  const approvedResponse = await getApprovedExpenseRequestsAction();
  const approvedData = approvedResponse.success && approvedResponse.data ? approvedResponse.data : [];

  return (
    <div className="flex flex-col gap-6 w-full p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          Review principal expense requests, the school manager letter, and the accountant purchase order. Approve and generate PDF when all three are complete.
        </p>
      </div>
      <PurchaseOrdersClient pendingData={pendingData as any[]} approvedData={approvedData as any[]} />
    </div>
  );
}
