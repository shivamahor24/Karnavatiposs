import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { Plus, HandCoins, UserCircle, MapPin, Phone, CreditCard, Edit, Camera, Save, Briefcase, Building, Calendar, Coins } from "lucide-react";
import { Badge } from "../../components/ui/badge";

export default function LoanManagement() {
  const [advances, setAdvances] = useState([]);
  const [emps, setEmps] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ employee_id: "", amount: "", emi_amount: "", reason: "", status: "Approved" });
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  // Profile Modal State
  const [profileDialog, setProfileDialog] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empSalary, setEmpSalary] = useState(null);

  // States for Auto-Calculating Advances
  const [selectedSalaryStruct, setSelectedSalaryStruct] = useState(null);

  const fetchAdvances = useCallback(async () => {
    try {
      const { data } = await api.get("/payroll/advances");
      setAdvances(data);
    } catch { toast.error("Failed to load salary advances"); }
  }, []);

  const fetchEmps = useCallback(async () => {
    try {
      const res = await api.get("/staff");
      setEmps(res.data.filter(e => e.status === "Active"));
    } catch { console.error("Failed to load staff"); }
  }, []);

  useEffect(() => {
    fetchAdvances();
    fetchEmps();
  }, [fetchAdvances, fetchEmps]);

  const handleSelectEmployee = async (empId) => {
    setForm(f => ({ ...f, employee_id: empId, amount: "", emi_amount: "" }));
    setSelectedSalaryStruct(null);
    if (!empId) return;
    try {
      const { data } = await api.get(`/payroll/employees/${empId}/structure`);
      setSelectedSalaryStruct(data);
    } catch {
      console.log("No salary structure found for this employee");
    }
  };

  const handleAmountChange = (amountVal) => {
    setForm(f => {
      return { ...f, amount: amountVal, emi_amount: amountVal ? Number(amountVal) : "" };
    });
  };

  const save = async () => {
    if (!form.employee_id || !form.amount || !form.emi_amount) { toast.error("Please fill required fields"); return; }
    setBusy(true);
    try {
      await api.post("/payroll/advances", { ...form, amount: Number(form.amount), emi_amount: Number(form.emi_amount) });
      toast.success("Advance granted successfully");
      setDialog(false);
      fetchAdvances();
    } catch { toast.error("Failed to grant advance"); }
    finally { setBusy(false); }
  };

  const openProfile = async (adv) => {
    const emp = emps.find(e => e.id === adv.employee_id) || { id: adv.employee_id, name: adv.employee_name };
    setSelectedEmp(emp);
    setProfileDialog(true);
    
    // Fetch employee's salary structure for read-only view in profile
    try {
      const { data } = await api.get(`/payroll/employees/${emp.id}/structure`);
      setEmpSalary(data);
    } catch {
      setEmpSalary(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Workforce Management</div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Salary Advances</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/payroll/structures">
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Coins className="w-4 h-4 text-slate-500" /> View Salaries
            </Button>
          </Link>
          <Button onClick={() => { 
            const firstEmpId = emps[0]?.id || "";
            setForm({employee_id: firstEmpId, amount: "", emi_amount: "", reason: "", status: "Approved"}); 
            handleSelectEmployee(firstEmpId);
            setDialog(true); 
          }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Issue Advance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advances.map(adv => {
          const emp = emps.find(e => e.id === adv.employee_id) || {};
          return (
            <Card key={adv.id} className="p-0 border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow bg-white overflow-hidden">
              {/* Employee Quick Profile Header */}
              <div 
                className="p-5 flex justify-between items-start border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors bg-gradient-to-br from-slate-50 to-white"
                onClick={() => openProfile(adv)}
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 overflow-hidden border border-indigo-100 shadow-sm">
                    {emp.photo ? (
                      <img src={emp.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-lg leading-tight hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                      {adv.employee_name}
                      {emp.government_id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="KYC Document Uploaded" />
                      )}
                      {emp.id && (
                        <Link 
                          to={`/staff?edit=${emp.id}`} 
                          onClick={(e) => e.stopPropagation()} 
                          className="text-slate-400 hover:text-indigo-600 transition-colors ml-1 p-0.5 hover:bg-slate-100 rounded"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                    <div className="text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {emp.designation || emp.role || 'Staff Member'}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                  {new Date(adv.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Employee Profile Details */}
              <div className="px-5 py-4 border-b border-slate-100/60 bg-white space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.mobile_number || <span className="text-slate-400 italic text-xs">No phone added</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.address || <span className="text-slate-400 italic text-xs">No address added</span>}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Salary: <span className="font-semibold text-slate-800">
                        {emp.salary_basic || emp.salary_hourly_rate ? (
                          emp.salary_wage_type === "Fixed" 
                            ? `₹${emp.salary_basic.toLocaleString("en-IN")}/mo` 
                            : `₹${emp.salary_hourly_rate.toLocaleString("en-IN")}/hr`
                        ) : (
                          <span className="text-slate-400 italic text-xs">Not configured</span>
                        )}
                      </span>
                    </span>
                  </div>
                  {emp.id && (
                    <Link to={`/payroll/structures?emp=${emp.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline shrink-0">
                      View Salary
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Advance Details */}
              <div className="p-5 flex-1 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Original Amount</span>
                  <span className="font-mono font-bold text-slate-800">₹{(adv.amount || adv.balance).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Monthly Deduction</span>
                  <span className="font-mono text-slate-600">₹{adv.emi_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2 mt-2">
                  <span className="text-slate-600 font-semibold">Net Salary Left</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {emp.salary_wage_type === "Fixed" && emp.salary_basic 
                      ? `₹${Math.max(0, emp.salary_basic - advances.filter(a => a.employee_id === emp.id).reduce((sum, a) => sum + a.balance, 0)).toLocaleString('en-IN')}`
                      : 'N/A'}
                  </span>
                </div>
                {adv.reason && <div className="text-xs italic text-slate-500 line-clamp-2 mt-2 bg-slate-100 p-2 rounded border border-slate-200/55">{adv.reason}</div>}
              </div>

              {/* Footer / Outstanding */}
              <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-white">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Outstanding</span>
                  <span className={`font-display text-xl font-bold ${adv.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{adv.balance.toLocaleString('en-IN')}
                  </span>
                </div>
                <Badge variant="outline" className={adv.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : adv.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}>
                  {adv.status}
                </Badge>
              </div>
            </Card>
          );
        })}
        {advances.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            No salary advances found.
          </div>
        )}
      </div>

      {/* Issue Advance Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold">Issue Salary Advance</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-slate-600">Select Employee</Label>
              <select value={form.employee_id} onChange={e => handleSelectEmployee(e.target.value)} className="w-full mt-1.5 px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Choose an employee...</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div><Label className="text-slate-600">Total Advance (₹)</Label><Input type="number" value={form.amount} onChange={e => handleAmountChange(e.target.value)} className="mt-1.5" /></div>
            </div>
            <div>
              <Label className="text-slate-600">Reason</Label>
              <Input placeholder="E.g. Medical emergency, Festival..." value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} className="mt-1.5" />
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm py-5">Approve & Issue Advance</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Profile Dialog */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden">
          {selectedEmp && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-6 text-center relative">
                <div className="mx-auto w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center mb-3">
                  {selectedEmp.photo ? (
                    <img src={selectedEmp.photo} alt={selectedEmp.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedEmp.name}</h2>
                <p className="text-indigo-100 text-sm font-medium">{selectedEmp.designation || selectedEmp.role || 'Staff Member'}</p>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                
                {/* 1. Contact Info Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0"><Phone className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Phone Number</p>
                        <p className="text-slate-800 font-medium truncate">{selectedEmp.mobile_number || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-rose-50 p-2 rounded-lg text-rose-600 shrink-0"><Phone className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Emergency Contact</p>
                        <p className="text-slate-800 font-medium truncate">{selectedEmp.emergency_contact || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-violet-50 p-2 rounded-lg text-violet-600 shrink-0"><MapPin className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 mb-0.5">Address</p>
                      <p className="text-slate-800 font-medium text-sm break-words">{selectedEmp.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Employment Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Employment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-amber-50 p-2 rounded-lg text-amber-600 shrink-0"><Building className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Department</p>
                        <p className="text-slate-800 font-medium truncate">{selectedEmp.department || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-emerald-50 p-2 rounded-lg text-emerald-600 shrink-0"><Calendar className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Joining Date</p>
                        <p className="text-slate-800 font-medium truncate">{selectedEmp.joining_date || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Salary Details Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Salary & Payroll</h3>
                  {empSalary ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 bg-sky-50 p-2 rounded-lg text-sky-600 shrink-0"><Coins className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-500 mb-0.5">Wage Type</p>
                          <p className="text-slate-800 font-medium truncate">{empSalary.wage_type}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0"><Coins className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-500 mb-0.5">
                            {empSalary.wage_type === "Fixed" ? "Basic Salary" : "Hourly Rate"}
                          </p>
                          <p className="text-slate-800 font-bold truncate">
                            ₹{empSalary.wage_type === "Fixed" 
                              ? empSalary.basic_salary?.toLocaleString("en-IN") 
                              : `${empSalary.hourly_rate?.toLocaleString("en-IN")}/hr`}
                          </p>
                        </div>
                      </div>
                      {empSalary.wage_type === "Fixed" && (
                        <>
                          <div className="flex items-start gap-3 md:col-span-2">
                            <div className="mt-0.5 bg-slate-50 p-2 rounded-lg text-slate-600 shrink-0"><Building className="w-4 h-4" /></div>
                            <div className="flex-grow">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Salary Allowances Breakdown</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                                <div className="flex justify-between"><span>HRA:</span><span className="font-medium">₹{empSalary.hra || 0}</span></div>
                                <div className="flex justify-between"><span>Conveyance:</span><span className="font-medium">₹{empSalary.conveyance || 0}</span></div>
                                <div className="flex justify-between"><span>Medical:</span><span className="font-medium">₹{empSalary.medical || 0}</span></div>
                                <div className="flex justify-between"><span>Special:</span><span className="font-medium">₹{empSalary.special_allowance || 0}</span></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 md:col-span-2">
                            <div className="mt-0.5 bg-slate-50 p-2 rounded-lg text-slate-600 shrink-0"><Coins className="w-4 h-4" /></div>
                            <div className="flex-grow">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Monthly Deductions</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                                <div className="flex justify-between"><span>PF:</span><span className="font-medium text-rose-600">₹{empSalary.pf_deduction || 0}</span></div>
                                <div className="flex justify-between"><span>ESI:</span><span className="font-medium text-rose-600">₹{empSalary.esi_deduction || 0}</span></div>
                                <div className="flex justify-between"><span>Prof Tax:</span><span className="font-medium text-rose-600">₹{empSalary.professional_tax || 0}</span></div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                      <p className="text-slate-500 italic text-sm">Salary details not configured</p>
                      <Link to={`/payroll/structures?emp=${selectedEmp.id}`} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded font-semibold hover:bg-indigo-100 transition-colors">
                        Configure Now
                      </Link>
                    </div>
                  )}
                </div>

                {/* 4. Bank Details & KYC Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Bank & KYC Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-sky-50 p-2 rounded-lg text-sky-600 shrink-0"><Coins className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Bank Name</p>
                        <p className="text-slate-800 font-medium truncate">{selectedEmp.bank_name || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><CreditCard className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">Account Number</p>
                        <p className="text-slate-800 font-medium truncate">{selectedEmp.bank_account || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-teal-50 p-2 rounded-lg text-teal-600 shrink-0"><Coins className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">IFSC Code</p>
                        <p className="text-slate-800 font-medium truncate font-mono uppercase">{selectedEmp.ifsc_code || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-pink-50 p-2 rounded-lg text-pink-600 shrink-0"><CreditCard className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">PAN / Aadhaar Number</p>
                        <p className="text-slate-800 font-medium truncate font-mono uppercase">{selectedEmp.pan_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Govt ID & QR Code Preview grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><CreditCard className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Government ID Document</p>
                        <div>
                          {selectedEmp.government_id ? (
                            <img src={selectedEmp.government_id} alt="Govt ID" className="max-h-32 object-contain rounded-lg border border-slate-200 mt-2" />
                          ) : (
                            <p className="text-slate-500 italic text-sm mt-2">No ID uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-violet-50 p-2 rounded-lg text-violet-600 shrink-0"><CreditCard className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Payment / UPI QR Code</p>
                        <div>
                          {selectedEmp.bank_qr_code ? (
                            <img src={selectedEmp.bank_qr_code} alt="UPI QR Code" className="max-h-32 object-contain rounded-lg border border-slate-200 mt-2" />
                          ) : (
                            <p className="text-slate-500 italic text-sm mt-2">No QR Code uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

