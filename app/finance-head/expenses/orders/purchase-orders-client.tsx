"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, FileText, ClipboardList, Building2,
  ChevronDown, ChevronUp, Printer, Loader2, AlertCircle, Clock
} from "lucide-react";
import { toast } from "sonner";
import { approvePurchaseOrderAction, rejectPurchaseOrderAction } from "@/app/actions/purchase-orders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ExpenseRequestRow = {
  id: string; no: number; objectType: string; objectDescription: string;
  measure: string; requestPurpose: string; quantity: number;
  status: string; createdAt: string | Date;
  managerLetter: {
    addressedTo: string | null; responsiblePerson: string | null;
    amountToBuy: number | null; measure: string | null;
    targetSection: string | null; purpose: string | null; payAmount: number | null;
    status: string;
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Submitted: "bg-blue-100 text-blue-700 border-blue-200",
    Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Draft: "bg-muted text-muted-foreground border-border",
    Rejected: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status] ?? map.Draft}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-5 gap-2 py-1.5 border-b last:border-0">
      <span className="col-span-2 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="col-span-3 text-xs text-foreground">{value ?? <span className="italic text-muted-foreground">—</span>}</span>
    </div>
  );
}

function Panel({ icon, title, badge, children, defaultOpen = false }: {
  icon: React.ReactNode; title: string; badge?: React.ReactNode;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
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

function RequestCard({ req }: { req: ExpenseRequestRow }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [voucherOpen, setVoucherOpen] = useState(false);
  const router = useRouter();

  const [voucherData, setVoucherData] = useState({
    toName: req.managerLetter?.responsiblePerson ?? "",
    purpose: req.requestPurpose ?? "",
    amountInWords: "",
    amountBirr: req.purchaseOrder?.totalAmount?.toString() ?? "",
    bankBranch: "",
    chequeNo: "",
    rows: [
      { acCode: "", debit: "", credit: "", description: "" },
      { acCode: "", debit: "", credit: "", description: "" },
      { acCode: "", debit: "", credit: "", description: "" }
    ],
    accountant: "",
    financeHead: "",
    gm: "",
    receiver: "",
    payer: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem(`payment_voucher_${req.id}`);
    if (saved) {
      try {
        setVoucherData(JSON.parse(saved));
      } catch (e) {}
    }
  }, [req.id]);

  const updateVoucher = (updates: Partial<typeof voucherData>) => {
    const newData = { ...voucherData, ...updates };
    setVoucherData(newData);
    localStorage.setItem(`payment_voucher_${req.id}`, JSON.stringify(newData));
  };

  const po = req.purchaseOrder;
  const ml = req.managerLetter;
  const canApprove = po?.status === "Submitted";

  const handleOpenVoucher = () => {
    setVoucherOpen(true);
  };

  const handleApproveAndDownload = () => {
    startTransition(async () => {
      const res = await approvePurchaseOrderAction(req.id);
      if (res.success) { 
        toast.success("Purchase order approved!"); 

        // Generate PDF
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (printWindow) {
          const html = `<!DOCTYPE html><html><head><title>Payment Voucher #${req.no}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 14px; color: #000; padding: 40px; }
  .line-field { display: flex; align-items: flex-end; margin-bottom: 20px; font-weight: bold; }
  .line-field .label { white-space: nowrap; margin-right: 10px; }
  .line-field .value { flex-grow: 1; border-bottom: 1px solid #000; min-height: 20px; padding-bottom: 2px; }
  .box-field { display: flex; align-items: center; margin-bottom: 20px; font-weight: bold; }
  .box-field .label { white-space: nowrap; margin-right: 10px; }
  .box-field .box { border: 1px solid #000; min-width: 200px; height: 30px; display: flex; align-items: center; padding: 0 10px; }
  table { width: 100%; border-collapse: collapse; margin: 30px 0; }
  th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
  th { font-weight: bold; text-align: center; }
  .table-title { text-align: center; font-weight: bold; margin-bottom: 10px; font-size: 16px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-box { margin-bottom: 30px; }
  .sig-box .label { font-weight: bold; margin-bottom: 40px; }
  .sig-box .line { border-bottom: 1px solid #000; width: 80%; }
</style>
</head><body>

  <div class="line-field">
    <div class="label">ለ / TO:</div>
    <div class="value">${voucherData.toName}</div>
  </div>
  
  <div class="line-field">
    <div class="label">የተከፈለበት ምክንያት / Purpose of payment:</div>
    <div class="value">${voucherData.purpose}</div>
  </div>

  <div class="line-field">
    <div class="label">የገንዘብ ልክ በፊደል / Amount in words:</div>
    <div class="value">${voucherData.amountInWords}</div>
  </div>

  <div class="box-field">
    <div class="label">ብር / Birr:</div>
    <div class="box">${voucherData.amountBirr}</div>
  </div>

  <div class="line-field">
    <div class="label">የተከፈለበት የባንክ ቅርንጫፍ / Bank Branch:</div>
    <div class="value">${voucherData.bankBranch}</div>
  </div>

  <div class="line-field">
    <div class="label">የቼክ ቁጥር / Cheque no.:</div>
    <div class="value">${voucherData.chequeNo}</div>
  </div>

  <div class="table-title">For Accounts Use Only</div>
  <table>
    <tr>
      <th>A/C Code</th>
      <th>DEBIT</th>
      <th>CREDIT</th>
      <th>DESCRIPTION</th>
    </tr>
    ${voucherData.rows.map(r => `
      <tr>
        <td style="height:30px;">${r.acCode}</td>
        <td>${r.debit}</td>
        <td>${r.credit}</td>
        <td>${r.description}</td>
      </tr>
    `).join("")}
    <tr>
      <td style="text-align: right; font-weight: bold; height:30px;">Total</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </table>

  <div class="sig-grid">
    <div class="sig-box">
      <div class="label">ያዘጋጀው (Accountant)</div>
      <div class="line">${voucherData.accountant}</div>
    </div>
    <div class="sig-box">
      <div class="label">ያረጋገጠው (Finance Head)</div>
      <div class="line">${voucherData.financeHead}</div>
    </div>
    <div class="sig-box">
      <div class="label">ያፀደቀው (GM / DGM)</div>
      <div class="line">${voucherData.gm}</div>
    </div>
    <div class="sig-box">
      <div class="label">የተከፋይ ስም እና ፊርማ (Receiver)</div>
      <div class="line">${voucherData.receiver}</div>
    </div>
    <div class="sig-box">
      <div class="label">የከፋይ ስም እና ፊርማ (Payer)</div>
      <div class="line">${voucherData.payer}</div>
    </div>
  </div>

</body></html>`;

          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); }, 500);
        }

        setVoucherOpen(false);
        router.refresh();
      }
      else toast.error(res.error ?? "Failed to approve");
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error("Please provide a reason."); return; }
    startTransition(async () => {
      const res = await rejectPurchaseOrderAction(req.id, rejectReason);
      if (res.success) { toast.success("Request rejected."); setRejectOpen(false); router.refresh(); }
      else toast.error(res.error ?? "Failed to reject");
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const html = `<!DOCTYPE html><html><head><title>Purchase Order #${req.no}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; }
  h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 12px; border-bottom: 1.5px solid #000; padding-bottom: 4px; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  .sub { color: #555; font-size: 10px; text-align:center; margin-bottom: 16px; }
  .paper { page-break-after: always; padding-bottom: 20px; }
  .paper:last-child { page-break-after: auto; }
  .sig { margin-top: 40px; display: flex; justify-content: space-between; }
  .sig div { text-align: center; width: 30%; }
  .sig div .line { border-top: 1px solid #000; margin-top: 30px; padding-top: 4px; font-size: 10px; }
  .empty-row td { height: 24px; }
</style>
</head><body>

<div class="paper">
  <h1>HAILE MARIAM MAMO SCHOOL</h1>
  <p class="sub">Paper 1 — Principal Expense Request</p>
  <h2>Request Details</h2>
  <table>
    <tr><th>No</th><th>Object Type</th><th>Description</th><th>Measure</th><th>Purpose</th><th>Qty</th></tr>
    <tr>
      <td>${req.no}</td><td>${req.objectType}</td><td>${req.objectDescription}</td>
      <td>${req.measure}</td><td>${req.requestPurpose}</td><td>${req.quantity}</td>
    </tr>
  </table>
  <div class="sig">
    <div><div class="line">Principal Signature</div></div>
    <div><div class="line">Date</div></div>
    <div><div class="line">Stamp</div></div>
  </div>
</div>

<div class="paper">
  <h1>HAILE MARIAM MAMO SCHOOL</h1>
  <p class="sub">Paper 2 — School Manager Authorization Letter</p>
  <h2>Authorization Details</h2>
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Addressed To</td><td>${ml?.addressedTo ?? "_________________________"}</td></tr>
    <tr><td>Responsible Person</td><td>${ml?.responsiblePerson ?? "_________________________"}</td></tr>
    <tr><td>Target Section</td><td>${ml?.targetSection ?? "_________________________"}</td></tr>
    <tr><td>Purpose</td><td>${ml?.purpose ?? "_________________________"}</td></tr>
    <tr><td>Amount to Buy</td><td>${ml?.amountToBuy ?? "_____"} ${ml?.measure ?? ""}</td></tr>
    <tr><td>Authorized Pay Amount (ETB)</td><td>${ml?.payAmount != null ? ml.payAmount.toLocaleString() + " ETB" : "_________________________"}</td></tr>
  </table>
  <div class="sig">
    <div><div class="line">School Manager Signature</div></div>
    <div><div class="line">Date</div></div>
    <div><div class="line">Stamp</div></div>
  </div>
</div>

<div class="paper">
  <h1>HAILE MARIAM MAMO SCHOOL</h1>
  <p class="sub">Paper 3 — Accountant Purchase Order</p>
  <h2>Purchase Order Details</h2>
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Addressed To</td><td>${po?.addressedTo ?? "_________________________"}</td></tr>
    <tr><td>Responsible Person</td><td>${po?.responsiblePerson ?? "_________________________"}</td></tr>
    <tr><td>Target Section</td><td>${po?.targetSection ?? "_________________________"}</td></tr>
    <tr><td>Purpose</td><td>${po?.purpose ?? "_________________________"}</td></tr>
    <tr><td>Item Description</td><td>${po?.itemDescription ?? "_________________________"}</td></tr>
    <tr><td>Measure</td><td>${po?.measure ?? "_________________________"}</td></tr>
    <tr><td>Quantity</td><td>${po?.quantity ?? "_____"}</td></tr>
    <tr><td>Unit Price (ETB)</td><td>${po?.unitPrice != null ? po.unitPrice.toLocaleString() : "_________________________"}</td></tr>
    <tr><td>Total Amount (ETB)</td><td>${po?.totalAmount != null ? po.totalAmount.toLocaleString() : "_________________________"}</td></tr>
    <tr><td>Payment Method</td><td>${po?.paymentMethod ?? "_________________________"}</td></tr>
    <tr><td>Receipt Number</td><td>${po?.receiptNumber ?? "_________________________"}</td></tr>
    <tr><td>Notes</td><td>${po?.notes ?? "_________________________"}</td></tr>
  </table>
  <div class="sig">
    <div><div class="line">Accountant Signature</div></div>
    <div><div class="line">Finance Head Signature</div></div>
    <div><div class="line">Date</div></div>
  </div>
</div>

<div class="paper">
  <h1>HAILE MARIAM MAMO SCHOOL</h1>
  <p class="sub">Paper 4 — Tracker's Manual Record (To be filled by Responsible Person)</p>
  <h2>Tracker Record Form</h2>
  <table>
    <tr><th>#</th><th>Item Purchased</th><th>Quantity</th><th>Unit Price (ETB)</th><th>Total (ETB)</th><th>Vendor / Shop</th><th>Date</th></tr>
    ${Array(6).fill('<tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join("")}
    <tr><td colspan="4" style="text-align:right;font-weight:bold">Grand Total</td><td></td><td></td><td></td></tr>
  </table>
  <p style="margin-top:8px;font-size:10px">Remaining Balance (ETB): ___________________________</p>
  <div class="sig">
    <div><div class="line">Responsible Person Signature</div></div>
    <div><div class="line">Finance Head Verification</div></div>
    <div><div class="line">Date</div></div>
  </div>
</div>

</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <Card className="shadow-md border-0 ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              #{req.no}
            </div>
            <div>
              <CardTitle className="text-base">{req.objectType}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{req.objectDescription}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <StatusBadge status={req.status} />
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 h-8 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print PDF
            </Button>
            {canApprove && (
              <>
                <Button size="sm" onClick={() => setRejectOpen(true)} variant="outline"
                  className="gap-1.5 h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
                <Button size="sm" onClick={handleOpenVoucher}
                  className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Approve
                </Button>
              </>
            )}
            {!canApprove && po?.status !== "Approved" && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="h-3.5 w-3.5" />
                <span>Awaiting accountant submission</span>
              </div>
            )}
            {po?.status === "Approved" && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Approved</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {/* Paper 1 */}
        <Panel icon={<FileText className="h-4 w-4" />} title="Paper 1 — Principal's Expense Request" defaultOpen>
          <div className="divide-y">
            <InfoRow label="Request No." value={req.no} />
            <InfoRow label="Object Type" value={req.objectType} />
            <InfoRow label="Object Description" value={req.objectDescription} />
            <InfoRow label="Measure" value={req.measure} />
            <InfoRow label="Request Purpose" value={req.requestPurpose} />
            <InfoRow label="Quantity" value={req.quantity} />
          </div>
        </Panel>

        {/* Paper 2 */}
        <Panel
          icon={<Building2 className="h-4 w-4" />}
          title="Paper 2 — School Manager Authorization Letter"
          badge={ml ? <span className="ml-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">{ml.status}</span> : <span className="ml-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">Awaiting</span>}
        >
          {!ml ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <p className="text-sm">The <strong>School Manager</strong> has not issued the authorization letter for this request yet.</p>
            </div>
          ) : null}
          <div className="divide-y">
            <InfoRow label="Addressed To" value={ml?.addressedTo} />
            <InfoRow label="Responsible Person" value={ml?.responsiblePerson} />
            <InfoRow label="Amount to Buy" value={ml?.amountToBuy != null ? `${ml.amountToBuy} ${ml.measure ?? ""}` : null} />
            <InfoRow label="Target Section" value={ml?.targetSection} />
            <InfoRow label="Purpose" value={ml?.purpose} />
            <InfoRow label="Authorized Pay Amount" value={ml?.payAmount != null ? `ETB ${ml.payAmount.toLocaleString()}` : null} />
            <InfoRow label="Letter Status" value={ml?.status ?? "Not Issued"} />
          </div>
        </Panel>

        {/* Paper 3 */}
        <Panel
          icon={<ClipboardList className="h-4 w-4" />}
          title="Paper 3 — Accountant Purchase Order"
          badge={po ? <StatusBadge status={po.status} /> : <StatusBadge status="Not Started" />}
        >
          {!po ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
              <ClipboardList className="h-6 w-6 opacity-40" />
              <p className="text-sm">The accountant has not filled the purchase order form yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              <InfoRow label="Addressed To" value={po.addressedTo} />
              <InfoRow label="Responsible Person" value={po.responsiblePerson} />
              <InfoRow label="Target Section" value={po.targetSection} />
              <InfoRow label="Purpose" value={po.purpose} />
              <InfoRow label="Item Description" value={po.itemDescription} />
              <InfoRow label="Measure" value={po.measure} />
              <InfoRow label="Quantity" value={po.quantity} />
              <InfoRow label="Unit Price" value={po.unitPrice != null ? `ETB ${po.unitPrice.toLocaleString()}` : null} />
              <InfoRow label="Total Amount" value={po.totalAmount != null ? `ETB ${po.totalAmount.toLocaleString()}` : null} />
              <InfoRow label="Payment Method" value={po.paymentMethod} />
              <InfoRow label="Receipt Number" value={po.receiptNumber} />
              <InfoRow label="Notes" value={po.notes} />
            </div>
          )}
        </Panel>
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reject Expense Request #{req.no}</DialogTitle>
            <p className="text-sm text-muted-foreground">Provide a reason that the principal will see.</p>
          </DialogHeader>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="E.g., Budget constraints this month. Please resubmit next quarter."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Voucher Dialog */}
      <Dialog open={voucherOpen} onOpenChange={setVoucherOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Voucher</DialogTitle>
            <p className="text-sm text-muted-foreground">Fill in the details to generate the payment voucher. The data will be saved locally.</p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="col-span-1 text-sm font-medium text-right">ለ / TO:</label>
                <input 
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={voucherData.toName} onChange={e => updateVoucher({ toName: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="col-span-1 text-sm font-medium text-right">የተከፈለበት ምክንያት / Purpose:</label>
                <input 
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={voucherData.purpose} onChange={e => updateVoucher({ purpose: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="col-span-1 text-sm font-medium text-right">የገንዘብ ልክ በፊደል / Amount in words:</label>
                <input 
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={voucherData.amountInWords} onChange={e => updateVoucher({ amountInWords: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="col-span-1 text-sm font-medium text-right">ብር / Birr:</label>
                <input 
                  type="number"
                  className="col-span-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={voucherData.amountBirr} onChange={e => updateVoucher({ amountBirr: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="col-span-1 text-sm font-medium text-right">የባንክ ቅርንጫፍ / Bank Branch:</label>
                <input 
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={voucherData.bankBranch} onChange={e => updateVoucher({ bankBranch: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="col-span-1 text-sm font-medium text-right">የቼክ ቁጥር / Cheque no.:</label>
                <input 
                  className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={voucherData.chequeNo} onChange={e => updateVoucher({ chequeNo: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-center font-semibold text-sm">For Accounts Use Only</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 border-b border-r text-center font-medium">A/C Code</th>
                      <th className="px-2 py-2 border-b border-r text-center font-medium">DEBIT</th>
                      <th className="px-2 py-2 border-b border-r text-center font-medium">CREDIT</th>
                      <th className="px-2 py-2 border-b text-center font-medium">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voucherData.rows.map((r, idx) => (
                      <tr key={idx}>
                        <td className="border-b border-r p-0">
                          <input className="w-full h-8 px-2 bg-transparent border-0 focus:ring-0 text-sm" value={r.acCode} 
                            onChange={e => {
                              const newRows = [...voucherData.rows];
                              newRows[idx].acCode = e.target.value;
                              updateVoucher({ rows: newRows });
                            }} 
                          />
                        </td>
                        <td className="border-b border-r p-0">
                          <input className="w-full h-8 px-2 bg-transparent border-0 focus:ring-0 text-sm" value={r.debit} 
                            onChange={e => {
                              const newRows = [...voucherData.rows];
                              newRows[idx].debit = e.target.value;
                              updateVoucher({ rows: newRows });
                            }} 
                          />
                        </td>
                        <td className="border-b border-r p-0">
                          <input className="w-full h-8 px-2 bg-transparent border-0 focus:ring-0 text-sm" value={r.credit} 
                            onChange={e => {
                              const newRows = [...voucherData.rows];
                              newRows[idx].credit = e.target.value;
                              updateVoucher({ rows: newRows });
                            }} 
                          />
                        </td>
                        <td className="border-b p-0">
                          <input className="w-full h-8 px-2 bg-transparent border-0 focus:ring-0 text-sm" value={r.description} 
                            onChange={e => {
                              const newRows = [...voucherData.rows];
                              newRows[idx].description = e.target.value;
                              updateVoucher({ rows: newRows });
                            }} 
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50">
                      <td className="border-r p-2 text-right font-medium">Total</td>
                      <td className="border-r p-2"></td>
                      <td className="border-r p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4 text-sm">
              <div className="space-y-2">
                <label className="font-medium">ያዘጋጀው (Accountant)</label>
                <input 
                  className="flex h-8 w-full border-b border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:border-primary"
                  value={voucherData.accountant} onChange={e => updateVoucher({ accountant: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">ያረጋገጠው (Finance Head)</label>
                <input 
                  className="flex h-8 w-full border-b border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:border-primary"
                  value={voucherData.financeHead} onChange={e => updateVoucher({ financeHead: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">ያፀደቀው (GM / DGM)</label>
                <input 
                  className="flex h-8 w-full border-b border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:border-primary"
                  value={voucherData.gm} onChange={e => updateVoucher({ gm: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">የተከፋይ ስም እና ፊርማ (Receiver)</label>
                <input 
                  className="flex h-8 w-full border-b border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:border-primary"
                  value={voucherData.receiver} onChange={e => updateVoucher({ receiver: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">የከፋይ ስም እና ፊርማ (Payer)</label>
                <input 
                  className="flex h-8 w-full border-b border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:border-primary"
                  value={voucherData.payer} onChange={e => updateVoucher({ payer: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoucherOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleApproveAndDownload} disabled={isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve & Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function PurchaseOrdersClient({ pendingData, approvedData }: { pendingData: ExpenseRequestRow[], approvedData: ExpenseRequestRow[] }) {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
        {pendingData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground border rounded-lg bg-muted/20">
            <FileText className="h-10 w-10 opacity-20" />
            <p className="font-medium">No pending expense requests</p>
            <p className="text-xs">Requests submitted by the accountant will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">{pendingData.length} pending request{pendingData.length !== 1 ? "s" : ""}</p>
            {pendingData.map(req => <RequestCard key={req.id} req={req} />)}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-xl font-bold">Past Orders (Accountant Submitted Data)</h2>
          <p className="text-xs text-muted-foreground">Historical view of all approved purchase orders.</p>
        </div>
        
        {approvedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
            <ClipboardList className="h-10 w-10 opacity-20" />
            <p className="font-medium">No past orders</p>
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium border-b whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left font-medium border-b whitespace-nowrap">Req No.</th>
                    <th className="px-4 py-3 text-left font-medium border-b whitespace-nowrap">Addressed To</th>
                    <th className="px-4 py-3 text-left font-medium border-b">Purpose</th>
                    <th className="px-4 py-3 text-left font-medium border-b">Item Description</th>
                    <th className="px-4 py-3 text-right font-medium border-b whitespace-nowrap">Total Amount</th>
                    <th className="px-4 py-3 text-center font-medium border-b whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {approvedData.map(req => {
                    const po = req.purchaseOrder;
                    return (
                      <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-primary">#{req.no}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{po?.addressedTo ?? "—"}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={po?.purpose ?? ""}>
                          {po?.purpose ?? "—"}
                        </td>
                        <td className="px-4 py-3 max-w-[250px] truncate" title={po?.itemDescription ?? ""}>
                          {po?.itemDescription ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                          {po?.totalAmount != null ? `ETB ${po.totalAmount.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Approved
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
