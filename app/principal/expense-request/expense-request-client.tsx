"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createExpenseRequestAction,
  updateExpenseRequestAction,
  deleteExpenseRequestAction,
  submitExpenseRequestAction,
} from "@/app/actions/expense-requests";
import { useRouter } from "next/navigation";

type ExpenseRequest = {
  id: string;
  no: number;
  objectType: string;
  objectDescription: string;
  measure: string;
  requestPurpose: string;
  quantity: number;
  evaluation: string | null;
  status: string;
};

export function ExpenseRequestClient({ initialData }: { initialData: ExpenseRequest[] }) {
  const [requests, setRequests] = useState(initialData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [formData, setFormData] = useState({
    id: "",
    objectType: "",
    objectDescription: "",
    measure: "",
    requestPurpose: "",
    quantity: 1,
  });

  const resetForm = () => {
    setFormData({
      id: "",
      objectType: "",
      objectDescription: "",
      measure: "",
      requestPurpose: "",
      quantity: 1,
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createExpenseRequestAction({
        objectType: formData.objectType,
        objectDescription: formData.objectDescription,
        measure: formData.measure,
        requestPurpose: formData.requestPurpose,
        quantity: formData.quantity,
      });

      if (result.success) {
        toast.success("Expense request added successfully as Draft.");
        setIsAddModalOpen(false);
        resetForm();
        router.refresh(); // Refresh to get the new data with auto-generated 'No'
      } else {
        toast.error("Failed to add request: " + result.error);
      }
    });
  };

  const openEditModal = (req: ExpenseRequest) => {
    setFormData({
      id: req.id,
      objectType: req.objectType,
      objectDescription: req.objectDescription,
      measure: req.measure,
      requestPurpose: req.requestPurpose,
      quantity: req.quantity,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateExpenseRequestAction(formData.id, {
        objectType: formData.objectType,
        objectDescription: formData.objectDescription,
        measure: formData.measure,
        requestPurpose: formData.requestPurpose,
        quantity: formData.quantity,
      });

      if (result.success) {
        toast.success("Expense request updated successfully.");
        setIsEditModalOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error("Failed to update request: " + result.error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft request?")) return;
    
    startTransition(async () => {
      const result = await deleteExpenseRequestAction(id);
      if (result.success) {
        toast.success("Request deleted successfully.");
        router.refresh();
      } else {
        toast.error("Failed to delete request: " + result.error);
      }
    });
  };

  const handleSubmitRequest = async (id: string) => {
    if (!confirm("Are you sure you want to submit this request? You won't be able to edit it afterwards.")) return;

    startTransition(async () => {
      const result = await submitExpenseRequestAction(id);
      if (result.success) {
        toast.success("Request submitted successfully. Status is now Pending.");
        router.refresh();
      } else {
        toast.error("Failed to submit request: " + result.error);
      }
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Draft": return "secondary";
      case "Pending": return "outline";
      case "Approved": return "default";
      case "Rejected": return "destructive";
      default: return "outline";
    }
  };

  // Sync state with props
  if (requests !== initialData) {
    setRequests(initialData);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Expense Requests</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Expense Request</DialogTitle>
                  <DialogDescription>
                    Create a new draft request. It will be assigned a tracking number automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="objectType" className="text-right">Type</Label>
                    <Input
                      id="objectType"
                      required
                      className="col-span-3"
                      value={formData.objectType}
                      onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="objectDescription" className="text-right">Description</Label>
                    <Input
                      id="objectDescription"
                      required
                      className="col-span-3"
                      value={formData.objectDescription}
                      onChange={(e) => setFormData({ ...formData, objectDescription: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="measure" className="text-right">Measure</Label>
                    <Input
                      id="measure"
                      required
                      className="col-span-3"
                      placeholder="e.g., pcs, boxes, kg"
                      value={formData.measure}
                      onChange={(e) => setFormData({ ...formData, measure: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="requestPurpose" className="text-right">Purpose</Label>
                    <Input
                      id="requestPurpose"
                      required
                      className="col-span-3"
                      value={formData.requestPurpose}
                      onChange={(e) => setFormData({ ...formData, requestPurpose: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      required
                      className="col-span-3"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Draft
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>Manage your expense requests and track their status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-center border-r">No</TableHead>
                <TableHead className="font-semibold border-r">Object Type</TableHead>
                <TableHead className="font-semibold border-r">Object Description</TableHead>
                <TableHead className="font-semibold text-center border-r">Measure</TableHead>
                <TableHead className="font-semibold border-r">Request Purpose</TableHead>
                <TableHead className="font-semibold text-center border-r">Quantity</TableHead>
                <TableHead className="font-semibold border-r">Evaluation</TableHead>
                <TableHead className="font-semibold text-center border-r">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No expense requests found. Click "Add Request" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-center font-medium border-r">{req.no}</TableCell>
                    <TableCell className="border-r">{req.objectType}</TableCell>
                    <TableCell className="border-r">{req.objectDescription}</TableCell>
                    <TableCell className="text-center border-r">{req.measure}</TableCell>
                    <TableCell className="border-r">{req.requestPurpose}</TableCell>
                    <TableCell className="text-center border-r">{req.quantity}</TableCell>
                    <TableCell className="border-r text-muted-foreground italic">
                      {req.evaluation || "Pending Evaluation"}
                    </TableCell>
                    <TableCell className="text-center border-r">
                      <Badge variant={getStatusBadgeVariant(req.status) as any}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {req.status === "Draft" ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => openEditModal(req)}
                            disabled={isPending}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                            onClick={() => handleDelete(req.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleSubmitRequest(req.id)}
                            disabled={isPending}
                          >
                            <Send className="h-4 w-4 mr-1" /> Submit
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Draft Request</DialogTitle>
              <DialogDescription>
                Modify your expense request details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-objectType" className="text-right">Type</Label>
                <Input
                  id="edit-objectType"
                  required
                  className="col-span-3"
                  value={formData.objectType}
                  onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-objectDescription" className="text-right">Description</Label>
                <Input
                  id="edit-objectDescription"
                  required
                  className="col-span-3"
                  value={formData.objectDescription}
                  onChange={(e) => setFormData({ ...formData, objectDescription: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-measure" className="text-right">Measure</Label>
                <Input
                  id="edit-measure"
                  required
                  className="col-span-3"
                  value={formData.measure}
                  onChange={(e) => setFormData({ ...formData, measure: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-requestPurpose" className="text-right">Purpose</Label>
                <Input
                  id="edit-requestPurpose"
                  required
                  className="col-span-3"
                  value={formData.requestPurpose}
                  onChange={(e) => setFormData({ ...formData, requestPurpose: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  required
                  className="col-span-3"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Draft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
