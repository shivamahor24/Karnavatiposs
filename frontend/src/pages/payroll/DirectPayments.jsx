import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Plus, Banknote, User, IndianRupee, Loader2 } from "lucide-react";
import api from "../../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export default function DirectPayments() {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    amount: "",
    payment_mode: "Cash",
    notes: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, empRes] = await Promise.all([
        api.get("/payroll/direct-payments"),
        api.get("/staff")
      ]);
      setPayments(payRes.data || []);
      setEmployees(empRes.data.filter(e => e.status === "Active") || []);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.amount || formData.amount <= 0) {
      toast.error("Please enter a valid amount and select an employee.");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post("/payroll/direct-payments", {
        employee_id: formData.employee_id,
        amount: parseFloat(formData.amount),
        payment_mode: formData.payment_mode,
        notes: formData.notes
      });
      toast.success("Direct payout recorded successfully.");
      setIsModalOpen(false);
      setFormData({ employee_id: "", amount: "", payment_mode: "Cash", notes: "" });
      fetchData();
    } catch (err) {
      toast.error("Failed to record payout.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Payroll & HR</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Gig / Direct Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">Record instant payouts for gig workers or ad-hoc advances.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-forest hover:bg-forest/90 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Record Payout
        </Button>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sand-subtle/50 text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Mode</th>
                <th className="p-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading payouts...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground">
                    <Banknote className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No direct payouts recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-sand-subtle/30">
                    <td className="p-4">{new Date(p.date).toLocaleString()}</td>
                    <td className="p-4 font-medium">{p.employee_name}</td>
                    <td className="p-4 font-bold text-forest">₹{p.amount.toLocaleString()}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-sand-subtle rounded-md text-xs">{p.payment_mode}</span></td>
                    <td className="p-4 text-muted-foreground max-w-[200px] truncate">{p.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl">Record Direct Payout</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Employee / Worker</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                  value={formData.employee_id}
                  onChange={e => setFormData({...formData, employee_id: e.target.value})}
                  required
                >
                  <option value="" disabled>Select employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.designation})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-10 font-mono"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mode</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.payment_mode}
                  onChange={e => setFormData({...formData, payment_mode: e.target.value})}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (Optional)</Label>
              <Input 
                placeholder="E.g., daily wage settlement" 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-forest hover:bg-forest/90 text-white">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                Save Payout
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
