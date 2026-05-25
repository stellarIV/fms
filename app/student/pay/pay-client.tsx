"use client";

import { useState } from "react";
import { initializeChapaPayment } from "@/app/actions/chapa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const MONTHS = ["Meskerem","Tikimt","Hidar","Tahsas","Tir","Yekatit","Megabit","Miyazia","Ginbot","Sene","Hamle","Nehase","Pagume"];

type Payment = {
  id: string;
  month: number;
  year: number;
  totalMonthlyFee: number;
  totalPayment: number;
  penaltyFee: number;
  tuitionFee: number;
  transportFee: number;
  registrationFee: number;
  libraryFee: number | null;
};

export function PayClient({ payments, studentName }: { payments: Payment[]; studentName: string }) {
  const [selected, setSelected] = useState<Payment | null>(payments[0] ?? null);
  const [amount, setAmount] = useState(payments[0]?.penaltyFee > 0 ? payments[0].penaltyFee : payments[0]?.totalMonthlyFee ?? 0);
  const [loading, setLoading] = useState(false);

  function selectPayment(p: Payment) {
    setSelected(p);
    setAmount(p.penaltyFee > 0 ? p.penaltyFee : p.totalMonthlyFee);
  }

  async function handlePay() {
    if (!selected || amount <= 0) return;
    setLoading(true);
    const result = await initializeChapaPayment(selected.id, amount);
    setLoading(false);
    if (result.success && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else {
      toast.error(result.error || "Payment initialization failed.");
    }
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No outstanding payments!</p>
          <p className="text-sm mt-1">All your fees are up to date.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Select Payment */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Select Month</h2>
        {payments.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPayment(p)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selected?.id === p.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{MONTHS[(p.month - 1)]} {p.year}</span>
              {p.penaltyFee > 0 ? (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />{p.penaltyFee.toLocaleString()} ETB
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">{p.totalMonthlyFee.toLocaleString()} ETB</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {p.penaltyFee > 0 ? `Balance remaining` : "Not yet paid"}
            </p>
          </button>
        ))}
      </div>

      {/* Payment Form */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 text-sm bg-muted/40 rounded-lg p-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{studentName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Month</span><span className="font-medium">{MONTHS[(selected.month - 1)]} {selected.year}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tuition</span><span>{(selected.tuitionFee || 0).toLocaleString()} ETB</span></div>
              {(selected.transportFee || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Transport</span><span>{selected.transportFee.toLocaleString()} ETB</span></div>}
              {(selected.registrationFee || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Registration</span><span>{selected.registrationFee.toLocaleString()} ETB</span></div>}
              {(selected.libraryFee || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Library</span><span>{selected.libraryFee!.toLocaleString()} ETB</span></div>}
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Total Due</span><span>{selected.totalMonthlyFee.toLocaleString()} ETB</span></div>
              {selected.totalPayment > 0 && <div className="flex justify-between text-green-600"><span>Already Paid</span><span>{selected.totalPayment.toLocaleString()} ETB</span></div>}
              {selected.penaltyFee > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>Balance</span><span>{selected.penaltyFee.toLocaleString()} ETB</span></div>}
            </div>

            <div className="space-y-2">
              <Label>Amount to Pay (ETB)</Label>
              <Input
                type="number"
                min={1}
                max={selected.penaltyFee > 0 ? selected.penaltyFee : selected.totalMonthlyFee}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            <Button className="w-full" size="lg" onClick={handlePay} disabled={loading || amount <= 0}>
              {loading ? "Redirecting to Chapa..." : (
                <><CreditCard className="h-4 w-4 mr-2" />Pay {amount.toLocaleString()} ETB via Chapa</>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You will be redirected to Chapa's secure payment page.
              Supports Telebirr, CBE Birr, Amole, and bank transfer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
