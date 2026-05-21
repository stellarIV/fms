"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardList, Building2, ChevronDown, ChevronUp, Save, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { savePurchaseOrderAction, submitPurchaseOrderAction } from "@/app/actions/purchase-orders";
import { useRouter } from "next/navigation";

type POData = {
  addressedTo: string; responsiblePerson: string; targetSection: string;
  purpose: string; itemDescription: string; measure: string;
  quantity: string; unitPrice: string; totalAmount: string;
  paymentMethod: string; receiptNumber: string; notes: string;
};

type ExpenseRequestRow = {
  id: string; no: number; objectType: string; objectDescription: string;
  measure: string; requestPurpose: string; quantity: number; status: string;
  managerLetter: {
    addressedTo: string | null; responsiblePerson: string | null;
    amountToBuy: number | null; measure: string | null;
    targetSection: string | null; purpose: string | null;
    payAmount: number | null; status: string;
  } | null;
  purchaseOrder: {
    addressedTo: string | null; responsiblePerson: string | null;
    targetSection: string | null; purpose: string | null;
    itemDescription: string | null; measure: string | null;
    quantity: number | null; unitPrice: number | null; totalAmount: number | null;
    paymentMethod: string | null; receiptNumber: string | null;
    notes: string | null; status: string;
  } | null;
};

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-5 gap-2 py-1.5 border-b last:border-0">
      <span className="col-span-2 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="col-span-3 text-xs">{value ?? <span className="italic text-muted-foreground">Not provided</span>}</span>
    </div>
  );
}

function Panel({ icon, title, badge, children, defaultOpen = false }: {
  icon: React.ReactNode; title: string; badge?: React.ReactNode;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-semibold text-sm">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function FormField({ label, id, required, type = "text", value, onChange, placeholder }: {
  label: string; id: string; required?: boolean; type?: string;
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input id={id} type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="h-8 text-sm" />
    </div>
  );
}

function RequestCard({ req }: { req: ExpenseRequestRow }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const ml = req.managerLetter;
  const existingPO = req.purchaseOrder;
  const isSubmitted = existingPO?.status === "Submitted" || existingPO?.status === "Approved";

  const [form, setForm] = useState<POData>({
    addressedTo: existingPO?.addressedTo ?? ml?.addressedTo ?? "",
    responsiblePerson: existingPO?.responsiblePerson ?? ml?.responsiblePerson ?? "",
    targetSection: existingPO?.targetSection ?? ml?.targetSection ?? "",
    purpose: existingPO?.purpose ?? ml?.purpose ?? req.requestPurpose,
    itemDescription: existingPO?.itemDescription ?? req.objectDescription,
    measure: existingPO?.measure ?? ml?.measure ?? req.measure,
    quantity: existingPO?.quantity?.toString() ?? ml?.amountToBuy?.toString() ?? req.quantity.toString(),
    unitPrice: existingPO?.unitPrice?.toString() ?? "",
    totalAmount: existingPO?.totalAmount?.toString() ?? ml?.payAmount?.toString() ?? "",
    paymentMethod: existingPO?.paymentMethod ?? "",
    receiptNumber: existingPO?.receiptNumber ?? "",
    notes: existingPO?.notes ?? "",
  });

  const set = (field: keyof POData) => (v: string) => {
    setForm(f => {
      const updated = { ...f, [field]: v };
      // Auto-calculate total
      if (field === "quantity" || field === "unitPrice") {
        const qty = parseFloat(field === "quantity" ? v : f.quantity) || 0;
        const up = parseFloat(field === "unitPrice" ? v : f.unitPrice) || 0;
        updated.totalAmount = (qty * up).toFixed(2);
      }
      return updated;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await savePurchaseOrderAction(req.id, {
        addressedTo: form.addressedTo,
        responsiblePerson: form.responsiblePerson,
        targetSection: form.targetSection,
        purpose: form.purpose,
        itemDescription: form.itemDescription,
        measure: form.measure,
        quantity: parseInt(form.quantity) || undefined,
        unitPrice: parseFloat(form.unitPrice) || undefined,
        totalAmount: parseFloat(form.totalAmount) || undefined,
        paymentMethod: form.paymentMethod,
        receiptNumber: form.receiptNumber,
        notes: form.notes,
      });
      if (res.success) { toast.success("Purchase order saved."); router.refresh(); }
      else toast.error(res.error ?? "Failed to save");
    });
  };

  const handleSubmit = () => {
    if (!form.addressedTo || !form.responsiblePerson || !form.itemDescription) {
      toast.error("Please fill required fields before submitting.");
      return;
    }
    startTransition(async () => {
      // Save first, then submit
      await savePurchaseOrderAction(req.id, {
        addressedTo: form.addressedTo,
        responsiblePerson: form.responsiblePerson,
        targetSection: form.targetSection,
        purpose: form.purpose,
        itemDescription: form.itemDescription,
        measure: form.measure,
        quantity: parseInt(form.quantity) || undefined,
        unitPrice: parseFloat(form.unitPrice) || undefined,
        totalAmount: parseFloat(form.totalAmount) || undefined,
        paymentMethod: form.paymentMethod,
        receiptNumber: form.receiptNumber,
        notes: form.notes,
      });
      const res = await submitPurchaseOrderAction(req.id);
      if (res.success) { toast.success("Purchase order submitted to Finance Head!"); router.refresh(); }
      else toast.error(res.error ?? "Failed to submit");
    });
  };

  return (
    <Card className="shadow-md border-0 ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              #{req.no}
            </div>
            <div>
              <CardTitle className="text-base">{req.objectType}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{req.objectDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {existingPO?.status === "Approved" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle className="h-4 w-4" /> Approved by Finance Head
              </span>
            )}
            {existingPO?.status === "Submitted" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                <Send className="h-4 w-4" /> Submitted — awaiting approval
              </span>
            )}
            {!existingPO && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-4 w-4" /> Not started
              </span>
            )}
            {existingPO?.status === "Draft" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClipboardList className="h-4 w-4" /> Draft saved
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {/* Paper 1 — read-only */}
        <Panel icon={<FileText className="h-4 w-4" />} title="Paper 1 — Principal's Expense Request" defaultOpen={false}>
          <div className="divide-y">
            <InfoRow label="Object Type" value={req.objectType} />
            <InfoRow label="Description" value={req.objectDescription} />
            <InfoRow label="Measure" value={req.measure} />
            <InfoRow label="Purpose" value={req.requestPurpose} />
            <InfoRow label="Quantity" value={req.quantity} />
          </div>
        </Panel>

        {/* Paper 2 — School Manager letter (read-only, prepped) */}
        <Panel
          icon={<Building2 className="h-4 w-4" />}
          title="Paper 2 — School Manager Authorization Letter"
          badge={ml ? <span className="ml-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">{ml.status}</span> : <span className="ml-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">Awaiting</span>}
        >
          {!ml ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p className="text-xs">The <strong>School Manager</strong> has not issued the authorization letter yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              <InfoRow label="Addressed To" value={ml.addressedTo} />
              <InfoRow label="Responsible Person" value={ml.responsiblePerson} />
              <InfoRow label="Amount to Buy" value={ml.amountToBuy != null ? `${ml.amountToBuy} ${ml.measure ?? ""}` : null} />
              <InfoRow label="Target Section" value={ml.targetSection} />
              <InfoRow label="Purpose" value={ml.purpose} />
              <InfoRow label="Authorized Pay Amount" value={ml.payAmount != null ? `ETB ${ml.payAmount.toLocaleString()}` : null} />
            </div>
          )}
        </Panel>

        {/* Paper 3 — Accountant fills this */}
        <Panel
          icon={<ClipboardList className="h-4 w-4" />}
          title="Paper 3 — Purchase Order Form"
          badge={existingPO ? (
            <span className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${existingPO.status === "Approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : existingPO.status === "Submitted" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-muted text-muted-foreground border-border"}`}>
              {existingPO.status}
            </span>
          ) : undefined}
          defaultOpen={true}
        >
          {isSubmitted ? (
            // Read-only view after submission
            <div className="divide-y">
              <InfoRow label="Addressed To" value={existingPO?.addressedTo} />
              <InfoRow label="Responsible Person" value={existingPO?.responsiblePerson} />
              <InfoRow label="Target Section" value={existingPO?.targetSection} />
              <InfoRow label="Purpose" value={existingPO?.purpose} />
              <InfoRow label="Item Description" value={existingPO?.itemDescription} />
              <InfoRow label="Measure" value={existingPO?.measure} />
              <InfoRow label="Quantity" value={existingPO?.quantity} />
              <InfoRow label="Unit Price (ETB)" value={existingPO?.unitPrice} />
              <InfoRow label="Total Amount (ETB)" value={existingPO?.totalAmount} />
              <InfoRow label="Payment Method" value={existingPO?.paymentMethod} />
              <InfoRow label="Receipt Number" value={existingPO?.receiptNumber} />
              <InfoRow label="Notes" value={existingPO?.notes} />
            </div>
          ) : (
            // Editable form
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Addressed To" id={`addressed-${req.id}`} required value={form.addressedTo} onChange={set("addressedTo")} placeholder="e.g., Procurement Officer" />
                <FormField label="Responsible Person" id={`resp-${req.id}`} required value={form.responsiblePerson} onChange={set("responsiblePerson")} placeholder="Full name" />
                <FormField label="Target Section" id={`section-${req.id}`} value={form.targetSection} onChange={set("targetSection")} placeholder="e.g., Grade 5, Library" />
                <FormField label="Purpose" id={`purpose-${req.id}`} required value={form.purpose} onChange={set("purpose")} placeholder="Purpose of purchase" />
                <FormField label="Item Description" id={`item-${req.id}`} required value={form.itemDescription} onChange={set("itemDescription")} placeholder="Detailed item description" />
                <FormField label="Measure" id={`measure-${req.id}`} value={form.measure} onChange={set("measure")} placeholder="e.g., pcs, kg, boxes" />
                <FormField label="Quantity" id={`qty-${req.id}`} type="number" value={form.quantity} onChange={set("quantity")} />
                <FormField label="Unit Price (ETB)" id={`up-${req.id}`} type="number" value={form.unitPrice} onChange={set("unitPrice")} placeholder="0.00" />
                <FormField label="Total Amount (ETB)" id={`total-${req.id}`} type="number" value={form.totalAmount} onChange={set("totalAmount")} />
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground font-medium">Payment Method</Label>
                  <select value={form.paymentMethod} onChange={e => set("paymentMethod")(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>
                <FormField label="Receipt Number" id={`receipt-${req.id}`} value={form.receiptNumber} onChange={set("receiptNumber")} placeholder="Receipt / Voucher #" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground font-medium">Notes</Label>
                <textarea value={form.notes} onChange={e => set("notes")(e.target.value)}
                  placeholder="Any additional notes..."
                  className="min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isPending} className="h-8 gap-1.5 text-xs">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Draft
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isPending} className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit to Finance Head
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </CardContent>
    </Card>
  );
}

export function AccountantOrdersClient({ initialData }: { initialData: ExpenseRequestRow[] }) {
  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
        <ClipboardList className="h-12 w-12 opacity-20" />
        <p className="text-lg font-medium">No pending purchase orders</p>
        <p className="text-sm">When principals submit expense requests, they will appear here for you to fill the purchase order form.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">{initialData.length} request{initialData.length !== 1 ? "s" : ""} awaiting purchase order</p>
      {initialData.map(req => <RequestCard key={req.id} req={req} />)}
    </div>
  );
}
