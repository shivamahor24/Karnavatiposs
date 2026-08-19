import React, { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { Plus, Gift, AlertTriangle } from "lucide-react";

export default function BonusesAndPenalties() {
  const [bonuses, setBonuses] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [emps, setEmps] = useState([]);
  
  const [activeTab, setActiveTab] = useState("bonuses"); // 'bonuses' | 'penalties'
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ employee_id: "", amount: "", reason: "", date: new Date().toISOString().slice(0,10) });
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        api.get("/payroll/bonuses"),
        api.get("/payroll/penalties")
      ]);
      setBonuses(bRes.data);
      setPenalties(pRes.data);
    } catch { toast.error("Failed to load records"); }
  }, []);

  useEffect(() => {
    fetchData();
    api.get("/staff").then(res => setEmps(res.data.filter(e => e.status === "Active"))).catch(console.error);
  }, [fetchData]);

  const save = async () => {
    if (!form.employee_id || !form.amount || !form.reason) { toast.error("Please fill required fields"); return; }
    setBusy(true);
    try {
      const endpoint = activeTab === "bonuses" ? "/payroll/bonuses" : "/payroll/penalties";
      await api.post(endpoint, { ...form, amount: Number(form.amount) });
      toast.success(`${activeTab === "bonuses" ? "Bonus" : "Penalty"} recorded successfully`);
      setDialog(false);
      fetchData();
    } catch { toast.error("Failed to save record"); }
    finally { setBusy(false); }
  };

  const currentData = activeTab === "bonuses" ? bonuses : penalties;
  const isBonus = activeTab === "bonuses";

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Workforce Management</div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Bonuses & Penalties</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setActiveTab("bonuses"); setForm({employee_id: emps[0]?.id || "", amount: "", reason: "", date: new Date().toISOString().slice(0,10)}); setDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Bonus
          </Button>
          <Button onClick={() => { setActiveTab("penalties"); setForm({employee_id: emps[0]?.id || "", amount: "", reason: "", date: new Date().toISOString().slice(0,10)}); setDialog(true); }} className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Penalty
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button onClick={() => setActiveTab("bonuses")} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${isBonus ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Bonuses & Incentives
        </button>
        <button onClick={() => setActiveTab("penalties")} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${!isBonus ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          Fines & Penalties
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentData.map(record => (
          <Card key={record.id} className="p-0 border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow bg-white overflow-hidden">
            <div className="p-5 flex justify-between items-start border-b border-slate-100">
              <div className="flex gap-4 items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isBonus ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {isBonus ? <Gift className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg leading-tight">{record.employee_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(record.date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 bg-slate-50/50 space-y-3">
              <div className="text-sm text-slate-600 font-medium">{record.reason}</div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-white">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Amount</span>
                <span className={`font-display text-xl font-bold ${isBonus ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{record.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-md ${record.status === "Paid" || record.status === "Deducted" ? 'bg-slate-100 text-slate-600' : isBonus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {record.status || "Pending"}
              </span>
            </div>
          </Card>
        ))}
        {currentData.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            No {isBonus ? "bonuses" : "penalties"} found for the current period.
          </div>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold">Record {isBonus ? "Bonus" : "Penalty"}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-slate-600">Select Employee</Label>
              <select value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))} className="w-full mt-1.5 px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Choose an employee...</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-600">Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="mt-1.5" /></div>
              <div><Label className="text-slate-600">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="mt-1.5" /></div>
            </div>
            <div>
              <Label className="text-slate-600">Reason</Label>
              <Input placeholder={isBonus ? "E.g. Diwali Bonus, Target met..." : "E.g. Late coming, damages..."} value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} className="mt-1.5" />
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={busy} className={`w-full text-white shadow-sm py-5 ${isBonus ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                Save {isBonus ? "Bonus" : "Penalty"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
