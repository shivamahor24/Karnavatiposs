import React, { useCallback, useEffect, useState, useRef } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { Play, CheckCircle2, FileText, Send, Wallet, Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../../components/ui/dialog";

export default function PayrollProcessing() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null); // items
  const [activeRunMetadata, setActiveRunMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [payslipData, setPayslipData] = useState(null); // null when hidden
  const [payDialog, setPayDialog] = useState(null); // { item, amount, mode }
  
  // New Run parameters
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const { t } = useLanguage();

  const fetchRuns = useCallback(async () => {
    try {
      const { data } = await api.get("/payroll/runs");
      setRuns(data);
    } catch { toast.error("Failed to fetch payroll runs"); }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const viewRun = async (run) => {
    setActiveRunMetadata(run);
    try {
      const { data } = await api.get(`/payroll/runs/${run.id}`);
      setSelectedRun(data.items);
    } catch { toast.error("Failed to load payroll details"); }
  };

  const processPayroll = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/payroll/process", { month: Number(month), year: Number(year) });
      toast.success("Payroll processed successfully!");
      fetchRuns();
      // automatically view the newly processed run
      const freshRuns = await api.get("/payroll/runs");
      const newRun = freshRuns.data.find(r => r.id === data.run_id);
      if (newRun) viewRun(newRun);
    } catch (e) { toast.error(e?.response?.data?.detail || "Processing failed"); }
    finally { setBusy(false); }
  };

  const updateStatus = async (status) => {
    if (!activeRunMetadata) return;
    try {
      await api.patch(`/payroll/runs/${activeRunMetadata.id}/status`, { status, payment_mode: status === "Paid" ? "Bank Transfer" : null });
      toast.success(`Payroll marked as ${status}`);
      fetchRuns();
      setActiveRunMetadata(prev => ({ ...prev, status }));
      viewRun({ ...activeRunMetadata, status });
    } catch { toast.error("Failed to update status"); }
  };

  const payItem = async () => {
    if (!payDialog || !payDialog.amount || !payDialog.mode) return;
    setBusy(true);
    try {
      await api.post(`/payroll/runs/${activeRunMetadata.id}/items/${payDialog.item.id}/pay`, {
        amount: Number(payDialog.amount),
        payment_mode: payDialog.mode
      });
      toast.success("Payment recorded!");
      setPayDialog(null);
      viewRun(activeRunMetadata);
      fetchRuns();
    } catch { toast.error("Failed to record payment"); }
    finally { setBusy(false); }
  };

  const printPayslip = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen print:p-0 print:bg-white print:min-h-0">
      
      {/* NORMAL DASHBOARD VIEW (Hidden when printing payslip) */}
      <div className={`flex gap-8 print:hidden ${payslipData ? "hidden" : ""}`}>
        <div className="w-1/3 min-w-[320px] flex flex-col h-[calc(100vh-100px)]">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Workforce Management</div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Payroll Batches</h1>
          </div>
          
          <Card className="p-5 border-slate-200 shadow-sm mb-6 bg-white shrink-0">
            <div className="font-bold text-slate-800 text-sm mb-3">Generate New Payroll</div>
            <div className="flex gap-3 mb-4">
              <select value={month} onChange={e => setMonth(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500">
                {Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>))}
              </select>
              <select value={year} onChange={e => setYear(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500">
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button onClick={processPayroll} disabled={busy} className="w-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm py-5">
              <Play className="w-4 h-4 mr-2" /> Run Payroll Calculation
            </Button>
          </Card>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {runs.map(r => (
              <button key={r.id} onClick={() => viewRun(r)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${activeRunMetadata?.id === r.id ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800">{new Date(r.year, r.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
                  <Badge variant="outline" className={`text-[10px] ${r.status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : r.status === "Approved" ? "bg-sky-50 text-sky-600 border-sky-200" : r.status === "Partial" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    {r.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>{r.employee_count} Emp.</span>
                  <span className="font-mono font-bold text-slate-700">₹{r.total_net_pay?.toLocaleString('en-IN')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 h-[calc(100vh-100px)]">
          {selectedRun ? (
            <Card className="border-slate-200 shadow-sm h-full flex flex-col bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Payroll: {new Date(activeRunMetadata.year, activeRunMetadata.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                  <div className="text-sm text-slate-500 mt-1 font-medium">Total Net Disbursement: <span className="font-bold text-slate-800 text-lg ml-1">₹{activeRunMetadata.total_net_pay?.toLocaleString('en-IN')}</span></div>
                </div>
                <div className="flex gap-3">
                  {activeRunMetadata.status === "Draft" && (
                    <Button onClick={() => updateStatus("Approved")} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold"><CheckCircle2 className="w-4 h-4 mr-2" /> Approve Payroll</Button>
                  )}
                  {activeRunMetadata.status === "Approved" && (
                    <Button onClick={() => updateStatus("Paid")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"><Send className="w-4 h-4 mr-2" /> Disburse Funds</Button>
                  )}
                </div>
              </div>
              
              <div className="overflow-auto flex-1 p-0">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <th className="p-4 bg-slate-50">Employee</th>
                      <th className="p-4 bg-slate-50 text-right">Cr. Days</th>
                      <th className="p-4 bg-slate-50 text-right">Gross Pay</th>
                      <th className="p-4 bg-slate-50 text-right">Bonuses</th>
                      <th className="p-4 bg-slate-50 text-right">Penalties</th>
                      <th className="p-4 bg-slate-50 text-right">Adv. Ded.</th>
                      <th className="p-4 bg-slate-50 text-right font-bold text-slate-700">Net Pay</th>
                      <th className="p-4 bg-slate-50 text-right">Paid</th>
                      <th className="p-4 bg-slate-50 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRun.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{item.employee_name}</td>
                        <td className="p-4 text-right font-mono text-xs text-slate-600">{item.days_credited}</td>
                        <td className="p-4 text-right font-mono text-xs text-slate-600">₹{item.gross_pay?.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-mono text-xs text-emerald-600">+₹{(item.bonuses || 0).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-mono text-xs text-rose-500">-₹{((item.deductions || 0) + (item.penalties || 0)).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-mono text-xs text-amber-600">-₹{(item.advance_deduction || item.loan_deduction || 0).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700 text-sm">₹{item.net_pay?.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-600 text-sm">₹{(item.paid_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center space-x-2">
                          {(activeRunMetadata.status === "Approved" || activeRunMetadata.status === "Partial") && (item.paid_amount || 0) < item.net_pay && (
                             <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setPayDialog({ item, amount: item.net_pay - (item.paid_amount || 0), mode: "Bank Transfer" })}>
                               Pay
                             </Button>
                          )}
                          {(activeRunMetadata.status === "Paid" || activeRunMetadata.status === "Partial") && (
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400" title="View Payslip" onClick={() => setPayslipData({ item, run: activeRunMetadata })}>
                               <FileText className="w-5 h-5"/>
                             </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center flex-col border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-500">
              <Wallet className="w-16 h-16 mb-4 text-slate-300" />
              <div className="font-medium">Select a payroll batch from the left menu to view details</div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Payment for {payDialog?.item?.employee_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">Total Net Pay</div>
              <div className="font-mono text-lg font-bold">₹{payDialog?.item?.net_pay?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Payment Amount (₹)</label>
              <input type="number" className="w-full mt-1 border border-slate-300 rounded px-3 py-2" value={payDialog?.amount || ""} onChange={e => setPayDialog(p => ({...p, amount: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Payment Mode</label>
              <select className="w-full mt-1 border border-slate-300 rounded px-3 py-2" value={payDialog?.mode || "Bank Transfer"} onChange={e => setPayDialog(p => ({...p, mode: e.target.value}))}>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <Button onClick={payItem} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FULL SCREEN PAYSLIP VIEW (Visible only when payslipData is set) */}
      {payslipData && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto print:static print:overflow-visible">
          
          {/* Header controls (hidden on print) */}
          <div className="sticky top-0 bg-slate-100 border-b border-slate-200 p-4 flex justify-between items-center shadow-sm print:hidden">
            <h3 className="font-bold text-slate-800">Payslip Preview</h3>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPayslipData(null)} className="bg-white"><X className="w-4 h-4 mr-2" /> Close</Button>
              <Button onClick={printPayslip} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Printer className="w-4 h-4 mr-2" /> Print to PDF</Button>
            </div>
          </div>

          {/* A4 Document Area */}
          <div className="max-w-[210mm] mx-auto bg-white p-[20mm] shadow-xl my-8 print:shadow-none print:m-0 print:p-0 font-sans text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Payslip</h1>
                <p className="text-lg text-slate-500 font-medium mt-1">
                  {new Date(payslipData.run.year, payslipData.run.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <div className="font-bold text-lg text-slate-900 mb-1">POS & HR Systems Inc.</div>
                <div>123 Business Park, Block A</div>
                <div>Ahmedabad, Gujarat 380001</div>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
              <div className="space-y-3">
                <div className="flex border-b border-slate-100 pb-2"><span className="w-32 font-semibold text-slate-500">Employee Name</span><span className="font-bold text-slate-900">{payslipData.item.employee_name}</span></div>
                <div className="flex border-b border-slate-100 pb-2"><span className="w-32 font-semibold text-slate-500">Employee ID</span><span className="font-bold">{payslipData.item.employee_id.substring(0,8).toUpperCase()}</span></div>
                <div className="flex border-b border-slate-100 pb-2"><span className="w-32 font-semibold text-slate-500">Designation</span><span className="font-bold">Staff</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex border-b border-slate-100 pb-2"><span className="w-32 font-semibold text-slate-500">Days Credited</span><span className="font-bold">{payslipData.item.days_credited}</span></div>
                <div className="flex border-b border-slate-100 pb-2"><span className="w-32 font-semibold text-slate-500">Payment Date</span><span className="font-bold">{new Date(payslipData.run.updated_at || payslipData.run.created_at).toLocaleDateString()}</span></div>
                <div className="flex border-b border-slate-100 pb-2"><span className="w-32 font-semibold text-slate-500">Payment Mode</span><span className="font-bold">{payslipData.run.payment_mode || "Bank Transfer"}</span></div>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full text-sm mb-8 border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="p-3 text-left w-1/2 font-bold uppercase tracking-wider text-xs">Earnings</th>
                  <th className="p-3 text-right font-bold uppercase tracking-wider text-xs border-r border-slate-300">Amount (₹)</th>
                  <th className="p-3 text-left w-1/2 font-bold uppercase tracking-wider text-xs">Deductions</th>
                  <th className="p-3 text-right font-bold uppercase tracking-wider text-xs">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="align-top font-mono">
                <tr>
                  {/* Earnings Col */}
                  <td className="p-0 border-r border-slate-300 col-span-2 w-1/2">
                    <table className="w-full">
                      <tbody>
                        <tr><td className="p-3">Basic Salary</td><td className="p-3 text-right">{payslipData.item.gross_pay.toLocaleString('en-IN')}</td></tr>
                        {payslipData.item.bonuses > 0 && <tr><td className="p-3">Bonuses & Incentives</td><td className="p-3 text-right">{payslipData.item.bonuses.toLocaleString('en-IN')}</td></tr>}
                        <tr className="invisible"><td className="p-3">-</td><td className="p-3">-</td></tr>
                        <tr className="invisible"><td className="p-3">-</td><td className="p-3">-</td></tr>
                      </tbody>
                    </table>
                  </td>
                  {/* Deductions Col */}
                  <td className="p-0 w-1/2">
                    <table className="w-full">
                      <tbody>
                        {payslipData.item.deductions > 0 && <tr><td className="p-3">Statutory Deductions (Tax/PF)</td><td className="p-3 text-right text-rose-600">{payslipData.item.deductions.toLocaleString('en-IN')}</td></tr>}
                        {payslipData.item.penalties > 0 && <tr><td className="p-3">Penalties/Fines</td><td className="p-3 text-right text-rose-600">{payslipData.item.penalties.toLocaleString('en-IN')}</td></tr>}
                        {(payslipData.item.advance_deduction > 0 || payslipData.item.loan_deduction > 0) && <tr><td className="p-3">Salary Advance EMI</td><td className="p-3 text-right text-rose-600">{(payslipData.item.advance_deduction || payslipData.item.loan_deduction).toLocaleString('en-IN')}</td></tr>}
                        {payslipData.item.direct_payments_deduction > 0 && <tr><td className="p-3">Gig/Insta-Payouts</td><td className="p-3 text-right text-rose-600">{payslipData.item.direct_payments_deduction.toLocaleString('en-IN')}</td></tr>}
                        {/* Padding for visual balance */}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 font-mono">
                <tr>
                  <td className="p-3 text-right uppercase text-xs tracking-wider border-r border-slate-300" colSpan="2">
                    <div className="flex justify-between w-full"><span>Total Earnings:</span> <span>₹{payslipData.item.gross_pay.toLocaleString('en-IN')}</span></div>
                  </td>
                  <td className="p-3 text-right uppercase text-xs tracking-wider text-rose-600" colSpan="2">
                    <div className="flex justify-between w-full"><span>Total Deductions:</span> <span>₹{((payslipData.item.deductions || 0) + (payslipData.item.advance_deduction || payslipData.item.loan_deduction || 0) + (payslipData.item.direct_payments_deduction || 0)).toLocaleString('en-IN')}</span></div>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Net Pay Highlight */}
            <div className="flex justify-end mb-16">
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 min-w-[300px]">
                <div className="text-sm uppercase tracking-widest font-bold text-emerald-700 mb-1">Net Pay</div>
                <div className="font-display text-4xl font-extrabold text-emerald-900 font-mono tracking-tight">₹{payslipData.item.net_pay.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 mt-20 border-t border-slate-200 pt-6">
              This is a computer generated document. No signature is required.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
