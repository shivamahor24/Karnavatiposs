import React, { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Plus, Calendar, Check, X as XIcon } from "lucide-react";
import { Badge } from "../../components/ui/badge";

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [emps, setEmps] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ employee_id: "", start_date: "", end_date: "", leave_type: "Unpaid", reason: "" });
  const [busy, setBusy] = useState(false);

  const fetchLeaves = useCallback(async () => {
    try {
      const { data } = await api.get("/payroll/leaves");
      setLeaves(data);
    } catch { toast.error("Failed to load leaves"); }
  }, []);

  useEffect(() => {
    fetchLeaves();
    api.get("/staff").then(res => setEmps(res.data.filter(e => e.status === "Active"))).catch(console.error);
  }, [fetchLeaves]);

  const save = async () => {
    if (!form.employee_id || !form.start_date || !form.end_date) { toast.error("Please fill required fields"); return; }
    setBusy(true);
    try {
      await api.post("/payroll/leaves", form);
      toast.success("Leave request submitted");
      setDialog(false);
      fetchLeaves();
    } catch { toast.error("Failed to submit leave"); }
    finally { setBusy(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/payroll/leaves/${id}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      fetchLeaves();
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Workforce Management</div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Leave Requests</h1>
        </div>
        <Button onClick={() => { setForm({employee_id: emps[0]?.id || "", start_date: "", end_date: "", leave_type: "Unpaid", reason: ""}); setDialog(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaves.map(leave => (
          <Card key={leave.id} className="p-0 border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow bg-white overflow-hidden">
            <div className="p-5 flex justify-between items-start border-b border-slate-100">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg leading-tight">{leave.employee_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(leave.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Leave Type</span>
                <span className="font-bold text-slate-800">{leave.leave_type}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Duration</span>
                <span className="font-mono text-slate-600">{leave.start_date} to {leave.end_date}</span>
              </div>
              {leave.reason && <div className="text-xs italic text-slate-500 line-clamp-2 mt-2 bg-slate-100 p-2 rounded">{leave.reason}</div>}
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-white">
              <Badge variant="outline" className={leave.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : leave.status === "Rejected" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                {leave.status}
              </Badge>
              {leave.status === "Pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => updateStatus(leave.id, "Rejected")}><XIcon className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => updateStatus(leave.id, "Approved")}><Check className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {leaves.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            No leave requests found.
          </div>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold">New Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-slate-600">Select Employee</Label>
              <select value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))} className="w-full mt-1.5 px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Choose an employee...</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-slate-600">Leave Type</Label>
              <select value={form.leave_type} onChange={e => setForm(f => ({...f, leave_type: e.target.value}))} className="w-full mt-1.5 px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Paid">Paid Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
                <option value="Sick">Sick Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-600">Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className="mt-1.5" /></div>
              <div><Label className="text-slate-600">End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} className="mt-1.5" /></div>
            </div>
            <div>
              <Label className="text-slate-600">Reason</Label>
              <Input placeholder="E.g. Medical emergency, Festival..." value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} className="mt-1.5" />
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm py-5">Submit Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
