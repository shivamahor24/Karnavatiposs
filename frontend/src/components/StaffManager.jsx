import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Users, Trash2, Plus, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import EmployeeDetailsDrawer from "./payroll/EmployeeDetailsDrawer";

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });

  const fetchStaff = async () => {
    try {
      const { data } = await api.get("/staff");
      setStaff(data);
    } catch (e) {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (editId && staff.length > 0) {
      const target = staff.find(s => s.id === editId);
      if (target) setSelectedStaff(target);
    }
  }, [editId, staff]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await api.post("/staff", form);
      toast.success("Staff account created successfully!");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "cashier" });
      fetchStaff();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create staff account");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff deleted");
      fetchStaff();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to delete");
    }
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0 rounded-[18px] md:rounded-[22px] lg:rounded-[26px] border-[#F4E6D7] bg-white shadow-sm p-3 md:p-4 lg:p-6 overflow-hidden">
      <div className="flex flex-row justify-between items-center mb-2.5 md:mb-4 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#FF6B00] shrink-0" />
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold font-display">Team Directory</h2>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] hover:brightness-105 text-white rounded-xl text-[11px] sm:text-xs md:text-xs lg:text-sm px-2.5 md:px-3.5 py-1 md:py-1.5 h-8 md:h-9">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[92vw] max-w-md rounded-[20px] md:rounded-[24px] border-[#F4E6D7] bg-[#FFFDF9] p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg lg:text-xl">Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3 md:space-y-4 mt-3 md:mt-4">
              <div>
                <Label className="text-xs md:text-xs lg:text-sm">Full Name</Label>
                <Input className="border-[#F4E6D7] bg-white rounded-xl text-xs h-9 md:h-10" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Rahul Kumar" />
              </div>
              <div>
                <Label className="text-xs md:text-xs lg:text-sm">Login Email</Label>
                <Input className="border-[#F4E6D7] bg-white rounded-xl text-xs h-9 md:h-10" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="cashier@example.com" />
              </div>
              <div>
                <Label className="text-xs md:text-xs lg:text-sm">Password</Label>
                <Input className="border-[#F4E6D7] bg-white rounded-xl text-xs h-9 md:h-10" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="At least 8 characters" />
              </div>
              <div className="flex justify-end pt-3 md:pt-4">
                <Button type="submit" disabled={busy} className="bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] hover:brightness-105 text-white rounded-xl text-xs">
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : staff.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground bg-[#FFF8F2] rounded-xl border border-[#F4E6D7]">
          No employees found. Add your first employee above.
        </div>
      ) : (
        <Card className="flex-1 flex flex-col min-h-0 rounded-[16px] md:rounded-[20px] border-[#F4E6D7] bg-white shadow-sm overflow-hidden">
          <div className="flex-1 overflow-auto min-h-0 w-full">
            <table className="w-full text-[11px] sm:text-xs md:text-[13px] lg:text-sm text-left min-w-[460px] sm:min-w-[520px] md:min-w-[560px]">
              <thead className="bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] text-white text-[10px] md:text-[11.5px] lg:text-[13px] uppercase tracking-[0.1em] sticky top-0 z-10">
                <tr>
                  <th className="px-2.5 md:px-3.5 py-2 md:py-2.5 font-medium">Name</th>
                  <th className="px-2.5 md:px-3.5 py-2 md:py-2.5 font-medium">Role</th>
                  <th className="px-2.5 md:px-3.5 py-2 md:py-2.5 font-medium">Department</th>
                  <th className="px-2.5 md:px-3.5 py-2 md:py-2.5 font-medium">Status</th>
                  <th className="px-2.5 md:px-3.5 py-2 md:py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4E6D7]">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FFF8F2] cursor-pointer transition-colors" onClick={() => setSelectedStaff(u)}>
                    <td className="px-2.5 md:px-3.5 py-2 md:py-2.5 font-medium">
                      <div className="flex items-center gap-2 md:gap-2.5">
                        <div className="w-6.5 h-6.5 md:w-7.5 md:h-7.5 rounded-full bg-[#FFF1E5] text-[#FF6B00] flex items-center justify-center font-bold text-[11px] uppercase overflow-hidden border border-[#F4E6D7] shrink-0">
                          {u.photo ? (
                            <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate text-xs md:text-[13px]">{u.name}</div>
                          <div className="text-[10px] md:text-[11px] text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 md:px-3.5 py-2 md:py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9.5px] md:text-[10.5px] font-medium bg-[#EEF8D9] text-[#78A61A] capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-2.5 md:px-3.5 py-2 md:py-2.5 text-muted-foreground whitespace-nowrap text-[11px] md:text-xs">{u.department || "-"}</td>
                    <td className="px-2.5 md:px-3.5 py-2 md:py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9.5px] md:text-[10.5px] font-medium ${u.status === "Active" ? "bg-[#EEF8D9] text-[#78A61A]" : "bg-red-100 text-red-800"}`}>
                        {u.status || "Active"}
                      </span>
                    </td>
                    <td className="px-2.5 md:px-3.5 py-2 md:py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedStaff(u)} className="h-7 w-7 text-slate-600 hover:bg-[#FFF4EB]" title="Edit Profile Details">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Delete Account">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedStaff && (
        <EmployeeDetailsDrawer 
          employee={selectedStaff} 
          onClose={() => setSelectedStaff(null)} 
          onUpdate={() => {
            fetchStaff();
            setSelectedStaff(null);
          }} 
        />
      )}
    </Card>
  );
}
