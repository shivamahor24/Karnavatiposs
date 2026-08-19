import React, { useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { Download, FileBarChart } from "lucide-react";

export default function PayrollReports() {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  // We are keeping reports simple: fetch JSON and export CSV locally
  const exportData = async (endpoint, filename) => {
    setBusy(true);
    try {
      const { data } = await api.get(endpoint);
      if (!data || data.length === 0) {
        toast.info("No data available to export");
        return;
      }
      // Simple CSV Converter
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setBusy(false);
    }
  };

  const reports = [
    { title: "Employee Directory", desc: "List of all active/inactive employees with basic details", endpoint: "/staff", file: "employees_export" },
    { title: "Active Loans", desc: "List of all loans and current outstanding balances", endpoint: "/payroll/loans", file: "loans_export" },
    { title: "Payroll Runs History", desc: "Summary of all generated payroll batches", endpoint: "/payroll/runs", file: "payrolls_export" }
  ];

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t("payroll_module") || "HR & Payroll"}</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Payroll Reports</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <Card key={i} className="p-5 border-border shadow-none hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-sand-subtle flex items-center justify-center text-terracota">
                <FileBarChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-display text-lg leading-tight">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            </div>
            <Button onClick={() => exportData(r.endpoint, r.file)} disabled={busy} variant="outline" className="w-full text-xs font-semibold">
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
