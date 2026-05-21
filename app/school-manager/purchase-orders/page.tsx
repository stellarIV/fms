import { getSchoolManagerOrdersAction } from "@/app/actions/purchase-orders";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SMOrdersClient } from "./sm-orders-client";

export default async function SMPurchaseOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "school_manager") redirect("/login");

  const response = await getSchoolManagerOrdersAction();
  const data = response.success && response.data ? response.data : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          Review pending expense requests from principals. Compose and send an official authorization letter for each approved request.
        </p>
      </div>
      <SMOrdersClient initialData={data as any[]} />
    </div>
  );
}
