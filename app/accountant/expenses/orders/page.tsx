import { getAccountantPurchaseOrdersAction } from "@/app/actions/purchase-orders";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountantOrdersClient } from "./accountant-orders-client";

export default async function AccountantOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "accountant") redirect("/login");

  const response = await getAccountantPurchaseOrdersAction();
  const data = response.success && response.data ? response.data : [];

  return (
    <div className="flex flex-col gap-6 w-full p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the purchase order details for each pending principal request based on the school manager's authorization letter. Submit for Finance Head approval.
        </p>
      </div>
      <AccountantOrdersClient initialData={data as any[]} />
    </div>
  );
}
