import { getExpenseRequestsAction } from "@/app/actions/expense-requests";
import { ExpenseRequestClient } from "./expense-request-client";
import { redirect } from "next/navigation";

export default async function ExpenseRequestPage() {
  const response = await getExpenseRequestsAction();

  if (!response.success && response.error === "Unauthorized") {
    redirect("/login");
  }

  const initialData = response.success && response.data ? response.data : [];

  return <ExpenseRequestClient initialData={initialData as any[]} />;
}
