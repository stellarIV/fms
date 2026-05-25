import { getStudentPayments } from "@/app/actions/chapa";
import { redirect } from "next/navigation";
import { PayClient } from "./pay-client";

export default async function PayPage() {
  const result = await getStudentPayments();
  if (!result.success || !result.data) redirect("/login");

  const { student, payments } = result.data;
  const unpaid = payments.filter((p) => (p.penaltyFee || 0) > 0 || (p.totalPayment || 0) === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pay Fees</h1>
        <p className="text-muted-foreground mt-1">Select a payment record and pay securely via Chapa.</p>
      </div>
      <PayClient payments={unpaid} studentName={student.name} />
    </div>
  );
}
