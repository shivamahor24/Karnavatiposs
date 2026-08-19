import React, { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { Clock, Save, UserCircle2 } from "lucide-react";

export default function AttendanceTracker() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [emps, setEmps] = useState([]);
  const [attendance, setAttendance] = useState({}); // { emp_id: { status, check_in, check_out, overtime_hours, late_mark } }
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  const load = useCallback(async () => {
    try {
      const [eRes, aRes] = await Promise.all([
        api.get("/staff"),
        api.get(`/payroll/attendance?date=${date}`)
      ]);
      setEmps(eRes.data.filter(e => e.status === "Active"));
      
      const attMap = {};
      eRes.data.forEach(e => {
        const exist = aRes.data.find(a => a.employee_id === e.id);
        attMap[e.id] = exist ? exist : { employee_id: e.id, date, status: "Present", check_in: "", check_out: "", overtime_hours: 0, late_mark: false };
      });
      setAttendance(attMap);
    } catch { toast.error("Failed to load attendance data"); }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const updateAtt = (empId, field, val) => {
    setAttendance(prev => ({ ...prev, [empId]: { ...prev[empId], [field]: val, date } }));
  };

  const save = async () => {
    setBusy(true);
    try {
      const records = Object.values(attendance);
      await api.post("/payroll/attendance", { records });
      toast.success("Attendance saved successfully");
    } catch { toast.error("Failed to save attendance"); }
    finally { setBusy(false); }
  };

  const statusColors = {
    "Present": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Absent": "bg-rose-50 text-rose-700 border-rose-200",
    "Half-Day": "bg-amber-50 text-amber-700 border-amber-200",
    "Leave": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Holiday": "bg-slate-50 text-slate-700 border-slate-200"
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Workforce Management</div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">Daily Attendance</h1>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white pl-9 shadow-sm border-slate-200" />
          </div>
          <Button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Logs
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="p-4">Employee</th>
                <th className="p-4 w-40">Status</th>
                <th className="p-4 w-40">Check-In</th>
                <th className="p-4 w-40">Check-Out</th>
                <th className="p-4 w-32 text-center">Overtime (Hrs)</th>
                <th className="p-4 w-24 text-center">Late Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emps.map(e => {
                const rec = attendance[e.id] || {};
                const sColor = statusColors[rec.status || "Present"];
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <UserCircle2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{e.name}</div>
                          <div className="text-xs text-slate-500">{e.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={rec.status || "Present"} 
                        onChange={ev => updateAtt(e.id, "status", ev.target.value)}
                        className={`w-full text-xs font-semibold px-2 py-2 rounded-md border outline-none cursor-pointer ${sColor}`}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half-Day">Half-Day</option>
                        <option value="Leave">Leave</option>
                        <option value="Holiday">Holiday</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <Input 
                        type="time" 
                        value={rec.check_in?.substring(11, 16) || ""} 
                        onChange={ev => updateAtt(e.id, "check_in", ev.target.value ? `${date}T${ev.target.value}:00Z` : "")} 
                        className="text-xs h-9 bg-slate-50 border-slate-200" 
                        disabled={rec.status === "Absent" || rec.status === "Holiday"}
                      />
                    </td>
                    <td className="p-4">
                      <Input 
                        type="time" 
                        value={rec.check_out?.substring(11, 16) || ""} 
                        onChange={ev => updateAtt(e.id, "check_out", ev.target.value ? `${date}T${ev.target.value}:00Z` : "")} 
                        className="text-xs h-9 bg-slate-50 border-slate-200" 
                        disabled={rec.status === "Absent" || rec.status === "Holiday"}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Input 
                        type="number" min="0" step="0.5" 
                        value={rec.overtime_hours || 0} 
                        onChange={ev => updateAtt(e.id, "overtime_hours", Number(ev.target.value))} 
                        className="w-16 text-xs h-9 mx-auto text-center border-slate-200" 
                      />
                    </td>
                    <td className="p-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rec.late_mark || false} 
                          onChange={ev => updateAtt(e.id, "late_mark", ev.target.checked)} 
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600" 
                        />
                      </label>
                    </td>
                  </tr>
                );
              })}
              {emps.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No active employees found to track attendance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
