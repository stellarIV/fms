import { verifyChapaPayment, mockRecordPayment } from "@/app/actions/chapa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, FlaskConical } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tx_ref?: string; mock?: string; amount?: string; pid?: string }>;
}) {
  const { tx_ref, mock, amount, pid } = await searchParams;

  if (!tx_ref) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">Invalid Payment Reference</h2>
            <p className="text-muted-foreground text-sm">No transaction reference found.</p>
            <Button asChild><Link href="/student/dashboard">Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMock = mock === "1";
  const result = isMock
    ? await mockRecordPayment(tx_ref, 0, pid)
    : await verifyChapaPayment(tx_ref, pid);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center space-y-4">
          {result.success ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
              {isMock && (
                <div className="flex items-center justify-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 w-fit mx-auto">
                  <FlaskConical className="h-3 w-3" /> Mock Mode — No real payment made
                </div>
              )}
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{result.amount?.toLocaleString()} ETB</span> has been recorded.
              </p>
              <p className="text-xs text-muted-foreground">Reference: {tx_ref}</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button asChild><Link href="/student/dashboard">Dashboard</Link></Button>
                <Button variant="outline" asChild><Link href="/student/payments">View History</Link></Button>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold">Payment Verification Failed</h2>
              <p className="text-muted-foreground text-sm">{result.error}</p>
              <Button asChild><Link href="/student/pay">Try Again</Link></Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
