"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, Send, Loader2, CheckCircle, Eye, PenLine,
  ClipboardList, Calendar, Hash, Building2
} from "lucide-react";
import { toast } from "sonner";
import { saveManagerLetterAction } from "@/app/actions/purchase-orders";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type LetterRow = {
  addressedTo: string | null; responsiblePerson: string | null;
  amountToBuy: number | null; measure: string | null;
  targetSection: string | null; purpose: string | null;
  payAmount: number | null; status: string;
};

type RequestRow = {
  id: string; no: number; objectType: string; objectDescription: string;
  measure: string; requestPurpose: string; quantity: number;
  status: string; createdAt: string | Date;
  managerLetter: LetterRow | null;
};

type LetterForm = {
  refNumber: string; addressedTo: string; responsiblePerson: string;
  targetSection: string; purpose: string;
  amountToBuy: string; measure: string; payAmount: string;
};

function emptyForm(req: RequestRow, existing: LetterRow | null): LetterForm {
  return {
    refNumber: existing ? "" : `SM/PO/${req.no}/${new Date().getFullYear()}`,
    addressedTo: existing?.addressedTo ?? "",
    responsiblePerson: existing?.responsiblePerson ?? "",
    targetSection: existing?.targetSection ?? "",
    purpose: existing?.purpose ?? req.requestPurpose,
    amountToBuy: existing?.amountToBuy?.toString() ?? req.quantity.toString(),
    measure: existing?.measure ?? req.measure,
    payAmount: existing?.payAmount?.toString() ?? "",
  };
}

/** Generates the formal letter HTML for printing */
function buildLetterHTML(req: RequestRow, form: LetterForm): string {
  const today = format(new Date(), "MMMM d, yyyy");
  return `<!DOCTYPE html>
<html><head><title>Authorization Letter — Ref ${form.refNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; padding: 40px 60px; line-height: 1.6; }
  .letterhead { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 24px; }
  .letterhead h1 { font-size: 18pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
  .letterhead p { font-size: 10pt; color: #333; margin-top: 2px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 11pt; }
  .subject { font-weight: bold; text-decoration: underline; margin-bottom: 16px; }
  .salutation { margin-bottom: 12px; }
  .body { margin-bottom: 20px; }
  .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .details-table th, .details-table td { border: 1px solid #000; padding: 6px 10px; text-align: left; font-size: 11pt; }
  .details-table th { background: #f0f0f0; font-weight: bold; }
  .closing { margin-top: 32px; }
  .signature { margin-top: 60px; display: flex; gap: 80px; }
  .signature div { text-align: center; }
  .signature div .line { border-top: 1px solid #000; margin-top: 50px; padding-top: 4px; font-size: 10pt; }
  .stamp-area { margin-top: 20px; border: 1px dashed #999; height: 80px; width: 120px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 9pt; }
  @media print { body { padding: 20px 40px; } }
</style>
</head><body>

<div class="letterhead">
  <h1>Haile Mariam Mamo Memorial School</h1>
  <p>School Management Office &nbsp;|&nbsp; Addis Ababa, Ethiopia</p>
  <p>Tel: +251-xxx-xxx-xxx &nbsp;|&nbsp; Email: admin@hmmschool.edu.et</p>
</div>

<div class="meta">
  <div><strong>Ref No:</strong> ${form.refNumber || `SM/PO/${req.no}/${new Date().getFullYear()}`}</div>
  <div><strong>Date:</strong> ${today}</div>
</div>

<div class="body">
  <p class="salutation"><strong>To: ${form.addressedTo || "___________________________"}</strong></p>

  <p class="subject">SUBJECT: PURCHASE AUTHORIZATION LETTER — ${req.objectType.toUpperCase()}</p>

  <p>
    This letter serves as an official authorization to procure the item(s) listed below, as requested
    by the school principal and approved by the School Manager. The designated responsible person is
    authorized to carry out the procurement on behalf of the school.
  </p>

  <table class="details-table">
    <tr><th>Field</th><th>Details</th></tr>
    <tr><td>Responsible Person / Tracker</td><td><strong>${form.responsiblePerson || "___________________________"}</strong></td></tr>
    <tr><td>Item Requested</td><td>${req.objectType} — ${req.objectDescription}</td></tr>
    <tr><td>Target Section / Department</td><td>${form.targetSection || "___________________________"}</td></tr>
    <tr><td>Purpose of Purchase</td><td>${form.purpose || req.requestPurpose}</td></tr>
    <tr><td>Amount to Purchase</td><td>${form.amountToBuy || req.quantity} ${form.measure || req.measure}</td></tr>
    <tr><td>Authorized Budget (ETB)</td><td><strong>ETB ${parseFloat(form.payAmount || "0").toLocaleString("en-ET", { minimumFractionDigits: 2 })}</strong></td></tr>
  </table>

  <p>
    The responsible person listed above is hereby instructed to purchase the specified items within
    the authorized budget and to submit all receipts and a completed tracker form to the Finance
    Department within <strong>5 working days</strong> of procurement.
  </p>
  <p>
    Any excess expenditure beyond the authorized amount must be pre-approved by the Finance Head
    before being incurred.
  </p>
</div>

<div class="closing">
  <p>Yours sincerely,</p>
</div>

<div class="signature">
  <div>
    <div class="line">School Manager Signature</div>
  </div>
  <div>
    <div class="line">Name &amp; Title</div>
  </div>
  <div>
    <div class="stamp-area">Official Stamp</div>
  </div>
</div>

</body></html>`;
}

function RequestCard({ req }: { req: RequestRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isComposing, setIsComposing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [form, setForm] = useState<LetterForm>(() => emptyForm(req, req.managerLetter));

  const ml = req.managerLetter;
  const isSent = ml?.status === "Sent";

  const set = (f: keyof LetterForm) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSaveDraft = () => {
    startTransition(async () => {
      const res = await saveManagerLetterAction(req.id, {
        addressedTo: form.addressedTo,
        responsiblePerson: form.responsiblePerson,
        amountToBuy: parseFloat(form.amountToBuy) || 0,
        measure: form.measure,
        targetSection: form.targetSection,
        purpose: form.purpose,
        payAmount: parseFloat(form.payAmount) || 0,
        refNumber: form.refNumber,
      }, false);
      if (res.success) { toast.success("Draft saved."); router.refresh(); }
      else toast.error(res.error ?? "Failed to save");
    });
  };

  const handleSendLetter = () => {
    if (!form.addressedTo || !form.responsiblePerson || !form.payAmount) {
      toast.error("Please fill all required fields before sending.");
      return;
    }
    startTransition(async () => {
      const res = await saveManagerLetterAction(req.id, {
        addressedTo: form.addressedTo,
        responsiblePerson: form.responsiblePerson,
        amountToBuy: parseFloat(form.amountToBuy) || 0,
        measure: form.measure,
        targetSection: form.targetSection,
        purpose: form.purpose,
        payAmount: parseFloat(form.payAmount) || 0,
        refNumber: form.refNumber,
      }, true);
      if (res.success) {
        toast.success("Letter sent! Accountant can now fill the Purchase Order.");
        setIsComposing(false);
        router.refresh();
      } else toast.error(res.error ?? "Failed to send");
    });
  };

  const handlePrintLetter = () => {
    const html = buildLetterHTML(req, isSent ? {
      refNumber: `SM/PO/${req.no}/${new Date().getFullYear()}`,
      addressedTo: ml?.addressedTo ?? "",
      responsiblePerson: ml?.responsiblePerson ?? "",
      targetSection: ml?.targetSection ?? "",
      purpose: ml?.purpose ?? req.requestPurpose,
      amountToBuy: ml?.amountToBuy?.toString() ?? req.quantity.toString(),
      measure: ml?.measure ?? req.measure,
      payAmount: ml?.payAmount?.toString() ?? "",
    } : form);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <Card className="border-0 ring-1 ring-border shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0 mt-0.5">
              #{req.no}
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base leading-tight">{req.objectType}</CardTitle>
              <p className="text-xs text-muted-foreground">{req.objectDescription}</p>
              <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Hash className="h-3 w-3" />Qty: {req.quantity} {req.measure}</span>
                <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{req.requestPurpose}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(req.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSent ? (
              <>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> Letter Sent
                </span>
                <Button variant="outline" size="sm" onClick={handlePrintLetter} className="h-8 gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" /> View / Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsComposing(true)} className="h-8 gap-1.5 text-xs text-muted-foreground">
                  <PenLine className="h-3.5 w-3.5" /> Revise
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsComposing(true)} className="h-8 gap-1.5 text-xs">
                <PenLine className="h-3.5 w-3.5" />
                {ml?.status === "Draft" ? "Continue Letter" : "Compose Letter"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Sent letter preview */}
      {isSent && (
        <CardContent className="pt-0">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Authorization Letter Issued
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground">To:</span> {ml?.addressedTo}</div>
              <div><span className="font-medium text-foreground">Tracker:</span> {ml?.responsiblePerson}</div>
              <div><span className="font-medium text-foreground">Section:</span> {ml?.targetSection}</div>
              <div><span className="font-medium text-foreground">Qty:</span> {ml?.amountToBuy} {ml?.measure}</div>
              <div><span className="font-medium text-foreground">Authorized:</span> ETB {ml?.payAmount?.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      )}

      {/* Compose letter dialog */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Compose Authorization Letter — Request #{req.no}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Fill in the letter details. Click <strong>Preview Letter</strong> to see the formatted PDF before sending.
            </p>
          </DialogHeader>

          {/* Reference info banner */}
          <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Principal's Request:</span>{" "}
            {req.objectType} — {req.objectDescription} &nbsp;|&nbsp; Qty: {req.quantity} {req.measure} &nbsp;|&nbsp; Purpose: {req.requestPurpose}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`ref-${req.id}`} className="text-xs text-muted-foreground">Reference Number</Label>
              <Input id={`ref-${req.id}`} value={form.refNumber} onChange={e => set("refNumber")(e.target.value)} className="h-8 text-sm" placeholder={`SM/PO/${req.no}/${new Date().getFullYear()}`} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`to-${req.id}`} className="text-xs text-muted-foreground">Addressed To <span className="text-red-500">*</span></Label>
              <Input id={`to-${req.id}`} value={form.addressedTo} onChange={e => set("addressedTo")(e.target.value)} className="h-8 text-sm" placeholder="e.g., Finance Head, Procurement Officer" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`person-${req.id}`} className="text-xs text-muted-foreground">Responsible Person / Tracker <span className="text-red-500">*</span></Label>
              <Input id={`person-${req.id}`} value={form.responsiblePerson} onChange={e => set("responsiblePerson")(e.target.value)} className="h-8 text-sm" placeholder="Full name of responsible person" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`section-${req.id}`} className="text-xs text-muted-foreground">Target Section / Department</Label>
              <Input id={`section-${req.id}`} value={form.targetSection} onChange={e => set("targetSection")(e.target.value)} className="h-8 text-sm" placeholder="e.g., Grade 9, Library, Lab" />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <Label htmlFor={`purpose-${req.id}`} className="text-xs text-muted-foreground">Purpose</Label>
              <Input id={`purpose-${req.id}`} value={form.purpose} onChange={e => set("purpose")(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`qty-${req.id}`} className="text-xs text-muted-foreground">Amount to Buy</Label>
              <div className="flex gap-2">
                <Input id={`qty-${req.id}`} type="number" value={form.amountToBuy} onChange={e => set("amountToBuy")(e.target.value)} className="h-8 text-sm w-24 shrink-0" />
                <Input value={form.measure} onChange={e => set("measure")(e.target.value)} className="h-8 text-sm" placeholder="unit (pcs, kg…)" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`pay-${req.id}`} className="text-xs text-muted-foreground">Authorized Pay Amount (ETB) <span className="text-red-500">*</span></Label>
              <Input id={`pay-${req.id}`} type="number" value={form.payAmount} onChange={e => set("payAmount")(e.target.value)} className="h-8 text-sm" placeholder="0.00" />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handlePrintLetter} className="gap-1.5 text-xs sm:mr-auto">
              <Eye className="h-3.5 w-3.5" /> Preview Letter
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={isPending} className="gap-1.5 text-xs">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Save Draft
            </Button>
            <Button size="sm" onClick={handleSendLetter} disabled={isPending} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Letter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function SMOrdersClient({ initialData }: { initialData: RequestRow[] }) {
  const pending = initialData.filter(r => r.managerLetter?.status !== "Sent");
  const sent = initialData.filter(r => r.managerLetter?.status === "Sent");

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
        <ClipboardList className="h-12 w-12 opacity-20" />
        <p className="text-lg font-medium">No pending expense requests</p>
        <p className="text-sm">Requests submitted by principals will appear here once approved and in Pending status.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            Awaiting Letter ({pending.length})
          </h2>
          {pending.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      )}
      {sent.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Letters Sent ({sent.length})
          </h2>
          {sent.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      )}
    </div>
  );
}
