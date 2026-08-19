import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Users, Banknote, Clock, Wallet, FileText, UserCheck, UserMinus, HandCoins, Activity, Coins } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function PayrollDashboard() {
  const [metrics, setMetrics] = useState({ 
    active_employees: 0, last_month_cost: 0, pending_payouts: 0,
    present_today: 0, absent_today: 0, outstanding_advances: 0,
    employee_balances: []
  });
  const { t } = useLanguage();

  useEffect(() => {
    api.get("/payroll/dashboard").then(res => setMetrics(res.data)).catch(() => toast.error("Failed to load dashboard"));
  }, []);

  const attendanceRate = metrics.active_employees > 0 
    ? Math.round((metrics.present_today / metrics.active_employees) * 100) 
    : 0;

  const topCards = [
    { label: "Active Employees", value: metrics.active_employees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "Present Today", value: metrics.present_today, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Absent Today", value: metrics.absent_today, icon: UserMinus, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { label: "Attendance Rate", value: `${attendanceRate}%`, icon: Activity, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" }
  ];

  const financialCards = [
    { label: "Last Month Payroll", value: `₹${metrics.last_month_cost?.toLocaleString("en-IN")}`, icon: Banknote, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Pending Payouts", value: metrics.pending_payouts, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Outstanding Advances", value: `₹${(metrics.outstanding_advances || 0).toLocaleString("en-IN")}`, icon: HandCoins, color: "text-violet-600", bg: "bg-violet-100" }
  ];

  return (
    <div className="h-full
    bg-[#FFFDF9]
    rounded-[32px]
    border
    border-[#F4E6D7]
    shadow-lg
    p-8
    flex
    flex-col
    overflow-hidden
  ">
    {/* <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen"> */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[15px]
          uppercase
          tracking-[0.1em]
          font-bold
          bg-gradient-to-r
          from-[#FF8A3D] to-[#FF6B00]
          bg-clip-text
          text-transparent">Workforce Management</div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">HR Dashboard</h1>
        </div>
        <Link to="/payroll/process" className="bg-gradient-to-r from-[#78A61A] to-[#5F9210] hover:brightness-105 rounded-xl text-white px-5 py-2.5  text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Run Payroll
        </Link>
      </div>

      {/* Top HR Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {topCards.map((c, i) => (
          <Card key={i} className={`p-4 md:p-5 border ${c.border} shadow-sm bg-white overflow-hidden relative group`}>
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 transition-transform group-hover:scale-150 ${c.bg}`}></div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
                  <c.icon className={`w-4 h-4 md:w-5 md:h-5 ${c.color}`} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{c.value}</div>
              <div className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Financial Overview */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800">Financial Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {financialCards.map((c, i) => (
              <Card key={i} className="p-4 md:p-5 border-slate-200 shadow-sm bg-white">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
                    <c.icon className={`w-5 h-5 md:w-6 md:h-6 ${c.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{c.label}</div>
                    <div className="font-bold text-lg md:text-xl text-slate-800 mt-0.5 truncate">{c.value}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-bold text-slate-800">Quick Links</h2>
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="divide-y divide-slate-100">
              <Link to="/staff" className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Users className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                <div className="font-semibold text-xs md:text-sm text-slate-700">Employee Directory</div>
              </Link>
              <Link to="/payroll/structures" className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-sky-50 flex items-center justify-center text-sky-600 shrink-0"><Coins className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                <div className="font-semibold text-xs md:text-sm text-slate-700">Salary Structures</div>
              </Link>
              <Link to="/payroll/attendance" className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Clock className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                <div className="font-semibold text-xs md:text-sm text-slate-700">Attendance Log</div>
              </Link>
              <Link to="/payroll/advances" className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-violet-50 flex items-center justify-center text-violet-600 shrink-0"><HandCoins className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                <div className="font-semibold text-xs md:text-sm text-slate-700">Salary Advances</div>
              </Link>
              <Link to="/payroll/reports" className="flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0"><FileText className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                <div className="font-semibold text-xs md:text-sm text-slate-700">Payroll Reports</div>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Employee Outstanding Balances */}
      {metrics.employee_balances && metrics.employee_balances.length > 0 && (
        <div className="mt-4 md:mt-6">
          <h2 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-4">Current Month Balances</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {metrics.employee_balances.map((emp, i) => (
              <Card key={i} className="p-4 border-slate-200 shadow-sm bg-white flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase text-xs">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="font-bold text-slate-800 text-sm truncate">{emp.name}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                    emp.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                    emp.status === "Partial" ? "bg-amber-100 text-amber-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {emp.status}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Gross</span><span>₹{emp.gross.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Advances/Deductions</span><span>-₹{(emp.advances + emp.deductions).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">Net Pending</span>
                  <span className={`font-bold ${emp.status === "Paid" ? "text-slate-400 line-through" : "text-rose-600"}`}>
                    ₹{emp.outstanding.toLocaleString("en-IN")}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
        </div>
     
    
  );
}
