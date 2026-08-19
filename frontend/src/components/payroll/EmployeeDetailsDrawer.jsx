import React, { useState, useEffect, useCallback } from "react";
import { X, Camera, Coins, Building, Calendar, DollarSign, Plus, HandCoins, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import api from "../../lib/api";
import { toast } from "sonner";
import { Badge } from "../ui/badge";

export default function EmployeeDetailsDrawer({ employee, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("Profile");
  const [form, setForm] = useState({ ...employee });
  const [busy, setBusy] = useState(false);

  // Salary Structure State
  const [salaryForm, setSalaryForm] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);

  // Advances State
  const [advances, setAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", emi_amount: "", reason: "", status: "Approved" });
  const [savingAdvance, setSavingAdvance] = useState(false);

  const tabs = ["Profile", "Salary & Payroll", "Advances", "Attendance", "Leaves", "Loans", "Bonuses", "Documents"];

  const fetchSalaryStructure = useCallback(async () => {
    setLoadingSalary(true);
    try {
      const { data } = await api.get(`/payroll/employees/${employee.id}/structure`);
      setSalaryForm(data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Initialize default structure for legacy employees who don't have one in DB yet
        setSalaryForm({
          employee_id: employee.id,
          wage_type: "Fixed",
          basic_salary: 0,
          hra: 0,
          conveyance: 0,
          medical: 0,
          special_allowance: 0,
          pf_deduction: 0,
          esi_deduction: 0,
          professional_tax: 0,
          hourly_rate: 0
        });
      } else {
        toast.error("Failed to load salary structure");
      }
    } finally {
      setLoadingSalary(false);
    }
  }, [employee.id]);

  const fetchAdvances = useCallback(async () => {
    setLoadingAdvances(true);
    try {
      const { data } = await api.get("/payroll/advances");
      setAdvances(data.filter(a => a.employee_id === employee.id));
    } catch {
      toast.error("Failed to load advances");
    } finally {
      setLoadingAdvances(false);
    }
  }, [employee.id]);

  useEffect(() => {
    fetchSalaryStructure();
  }, [fetchSalaryStructure]);

  useEffect(() => {
    if (activeTab === "Advances") {
      fetchAdvances();
    }
  }, [activeTab, fetchAdvances]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/staff/${employee.id}`, form);
      toast.success("Profile updated!");
      onUpdate();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    setSavingSalary(true);
    try {
      await api.put(`/payroll/employees/${employee.id}/structure`, salaryForm);
      toast.success("Salary structure updated!");
    } catch {
      toast.error("Failed to update salary structure");
    } finally {
      setSavingSalary(false);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (!advanceForm.amount || !advanceForm.emi_amount) {
      toast.error("Please fill in advance amount and monthly deduction");
      return;
    }
    setSavingAdvance(true);
    try {
      await api.post("/payroll/advances", {
        ...advanceForm,
        employee_id: employee.id,
        amount: Number(advanceForm.amount),
        emi_amount: Number(advanceForm.emi_amount)
      });
      toast.success("Advance granted successfully!");
      setShowAddAdvance(false);
      setAdvanceForm({ amount: "", emi_amount: "", reason: "", status: "Approved" });
      fetchAdvances();
    } catch {
      toast.error("Failed to issue advance");
    } finally {
      setSavingAdvance(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-sand-subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-terracota text-white flex items-center justify-center font-bold text-xl uppercase overflow-hidden border border-border">
              {form.photo ? (
                <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                employee.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">{employee.name}</h2>
              <p className="text-sm text-muted-foreground">{form.designation || form.role} • {form.department || "No Department"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-border px-4 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-terracota text-terracota" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* 1. Profile Management */}
          {activeTab === "Profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Photo Upload */}
              <div className="flex gap-6 items-center border-b border-border pb-6">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-sand flex items-center justify-center border border-border group shrink-0">
                  {form.photo ? (
                    <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-xs text-center p-2">No Photo</span>
                  )}
                  <label className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px]">Change</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "photo")} />
                  </label>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-0.5 text-foreground">Profile Photo</h4>
                  <p className="text-xs text-muted-foreground">Hover and click the image to upload a new profile photo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <Label>Login Email</Label>
                  <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} required type="email" />
                </div>
                <div>
                  <Label>System Role</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracota"
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input value={form.mobile_number || ""} onChange={e => setForm({...form, mobile_number: e.target.value})} />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input value={form.designation || ""} onChange={e => setForm({...form, designation: e.target.value})} />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={form.department || ""} onChange={e => setForm({...form, department: e.target.value})} />
                </div>
                <div>
                  <Label>Joining Date</Label>
                  <Input type="date" value={form.joining_date || ""} onChange={e => setForm({...form, joining_date: e.target.value})} />
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracota"
                    value={form.employment_type || "Full-Time"}
                    onChange={e => setForm({...form, employment_type: e.target.value})}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4 text-lg">Bank Details & KYC</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={form.bank_name || ""} onChange={e => setForm({...form, bank_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input value={form.bank_account || ""} onChange={e => setForm({...form, bank_account: e.target.value})} />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input value={form.ifsc_code || ""} onChange={e => setForm({...form, ifsc_code: e.target.value})} />
                  </div>
                  <div>
                    <Label>PAN / Aadhaar</Label>
                    <Input value={form.pan_number || ""} onChange={e => setForm({...form, pan_number: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Government ID / Photo ID Document</Label>
                    <div className="mt-1.5 border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center bg-sand-subtle">
                      {form.government_id ? (
                        <div className="relative group max-h-32 overflow-hidden rounded">
                          <img src={form.government_id} alt="Government ID" className="max-h-32 object-contain" />
                          <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera className="w-5 h-5" />
                            <span className="text-xs">Update Document</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "government_id")} />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground py-4 w-full">
                          <Camera className="w-6 h-6 mb-2 text-terracota/50" />
                          <span className="text-xs">Upload Government ID Image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "government_id")} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Payment / UPI QR Code</Label>
                    <div className="mt-1.5 border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center bg-sand-subtle">
                      {form.bank_qr_code ? (
                        <div className="relative group max-h-32 overflow-hidden rounded">
                          <img src={form.bank_qr_code} alt="UPI QR Code" className="max-h-32 object-contain" />
                          <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera className="w-5 h-5" />
                            <span className="text-xs">Update QR Code</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "bank_qr_code")} />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground py-4 w-full">
                          <Camera className="w-6 h-6 mb-2 text-terracota/50" />
                          <span className="text-xs">Upload UPI / Bank QR Code Image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "bank_qr_code")} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Salary & Payroll</h3>
                  <button type="button" onClick={() => setActiveTab("Salary & Payroll")} className="text-xs text-terracota hover:underline font-semibold">
                    Manage Salary
                  </button>
                </div>
                <div className="bg-sand-subtle/50 p-4 rounded-lg border border-border">
                  {salaryForm ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">Wage Type</span>
                        <span className="font-medium">{salaryForm.wage_type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          {salaryForm.wage_type === "Fixed" ? "Basic Salary" : "Hourly Rate"}
                        </span>
                        <span className="font-bold text-terracota">
                          ₹{salaryForm.wage_type === "Fixed" 
                            ? salaryForm.basic_salary?.toLocaleString("en-IN") 
                            : `${salaryForm.hourly_rate?.toLocaleString("en-IN")}/hr`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Salary structure not configured yet.</span>
                      <button type="button" onClick={() => setActiveTab("Salary & Payroll")} className="text-xs bg-terracota/10 text-terracota px-2.5 py-1.5 rounded font-semibold hover:bg-terracota/20 transition-colors">
                        Configure Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4 text-lg">Other Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Emergency Contact</Label>
                    <Input value={form.emergency_contact || ""} onChange={e => setForm({...form, emergency_contact: e.target.value})} />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={busy} className="bg-terracota text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {/* 2. Salary & Payroll (Structure) Management */}
          {activeTab === "Salary & Payroll" && (
            <div>
              {loadingSalary ? (
                <div className="text-center py-10 text-muted-foreground">Loading salary details...</div>
              ) : salaryForm ? (
                <form onSubmit={handleSaveSalary} className="space-y-6">
                  <div>
                    <Label>Wage Type</Label>
                    <select
                      value={salaryForm.wage_type}
                      onChange={e => setSalaryForm(f => ({ ...f, wage_type: e.target.value }))}
                      className="w-full max-w-xs mt-1.5 px-3 py-2.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracota"
                    >
                      <option value="Fixed">Fixed Monthly Salary</option>
                      <option value="Hourly">Hourly Wage</option>
                    </select>
                  </div>

                  {salaryForm.wage_type === "Fixed" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Basic Salary (₹)</Label>
                          <Input type="number" value={salaryForm.basic_salary} onChange={e => setSalaryForm(f => ({ ...f, basic_salary: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>House Rent Allowance (HRA)</Label>
                          <Input type="number" value={salaryForm.hra} onChange={e => setSalaryForm(f => ({ ...f, hra: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Conveyance</Label>
                          <Input type="number" value={salaryForm.conveyance} onChange={e => setSalaryForm(f => ({ ...f, conveyance: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Medical Allowance</Label>
                          <Input type="number" value={salaryForm.medical} onChange={e => setSalaryForm(f => ({ ...f, medical: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Special Allowance</Label>
                          <Input type="number" value={salaryForm.special_allowance} onChange={e => setSalaryForm(f => ({ ...f, special_allowance: Number(e.target.value) }))} />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Statutory Deductions</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>PF Deduction</Label>
                          <Input type="number" value={salaryForm.pf_deduction} onChange={e => setSalaryForm(f => ({ ...f, pf_deduction: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>ESI Deduction</Label>
                          <Input type="number" value={salaryForm.esi_deduction} onChange={e => setSalaryForm(f => ({ ...f, esi_deduction: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Professional Tax</Label>
                          <Input type="number" value={salaryForm.professional_tax} onChange={e => setSalaryForm(f => ({ ...f, professional_tax: Number(e.target.value) }))} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Hourly Rate (₹/hr)</Label>
                        <Input type="number" value={salaryForm.hourly_rate} onChange={e => setSalaryForm(f => ({ ...f, hourly_rate: Number(e.target.value) }))} />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" disabled={savingSalary} className="bg-terracota text-white flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {savingSalary ? "Saving..." : "Save Salary Details"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-10 text-muted-foreground">Salary structure not initialized. Please save to create one.</div>
              )}
            </div>
          )}

          {/* 3. Advances Management */}
          {activeTab === "Advances" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-terracota" />
                  Salary Advances
                </h3>
                <Button size="sm" onClick={() => setShowAddAdvance(!showAddAdvance)} className="bg-terracota text-white hover:bg-terracota-hover flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  {showAddAdvance ? "View Advances" : "Issue Advance"}
                </Button>
              </div>

              {showAddAdvance ? (
                <form onSubmit={handleAddAdvance} className="space-y-4 max-w-md bg-sand-subtle/40 p-5 rounded-lg border border-border">
                  <h4 className="font-semibold text-sm text-foreground">Issue New Advance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Advance (₹)</Label>
                      <Input type="number" required value={advanceForm.amount} onChange={e => setAdvanceForm(f => ({ ...f, amount: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label>Monthly Deduction (₹)</Label>
                      <Input type="number" required value={advanceForm.emi_amount} onChange={e => setAdvanceForm(f => ({ ...f, emi_amount: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Input placeholder="E.g. Medical emergency, festival" value={advanceForm.reason} onChange={e => setAdvanceForm(f => ({ ...f, reason: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddAdvance(false)}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={savingAdvance} className="bg-terracota text-white">
                      {savingAdvance ? "Granting..." : "Approve & Grant"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  {loadingAdvances ? (
                    <div className="text-center py-10 text-muted-foreground">Loading advances...</div>
                  ) : advances.length === 0 ? (
                    <div className="text-center py-10 text-sm text-muted-foreground bg-sand-subtle/50 rounded-lg border border-dashed border-border">
                      No advances found for this employee.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {advances.map(adv => (
                        <div key={adv.id} className="p-4 border border-border rounded-lg bg-white shadow-sm flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground font-mono">{new Date(adv.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500 italic mt-0.5">{adv.reason || "No reason provided"}</div>
                            <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                              <span>Orig: ₹{adv.balance.toLocaleString('en-IN')}</span>
                              <span>EMI: ₹{adv.emi_amount.toLocaleString('en-IN')}/mo</span>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Outstanding</div>
                            <div className={`font-mono font-bold text-base ${adv.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              ₹{adv.balance.toLocaleString('en-IN')}
                            </div>
                            <Badge variant="outline" className={adv.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]" : "bg-slate-50 text-slate-600 text-[10px]"}>
                              {adv.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Under Construction Tabs */}
          {activeTab !== "Profile" && activeTab !== "Salary & Payroll" && activeTab !== "Advances" && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-terracota/50">🚧</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Under Construction</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                The {activeTab} module for {employee.name} is currently being developed and will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
