import React, { useCallback, useEffect, useState } from "react";
import api, { API, tokenStore } from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Download, FileSpreadsheet, FileText, Package, BarChart3, AlertTriangle, TrendingDown, Truck, Archive } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

const REPORT_TABS = [
  { key: "current-stock", label: "Current Stock", icon: Package },
  { key: "valuation", label: "Valuation", icon: BarChart3 },
  { key: "movement", label: "Movement", icon: TrendingDown },
  { key: "low-stock", label: "Low Stock", icon: AlertTriangle },
  { key: "dead-stock", label: "Dead Stock", icon: Archive },
  { key: "purchases", label: "Purchases", icon: Truck },
];

export default function InventoryReports() {
  const [tab, setTab] = useState("current-stock");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { t } = useLanguage();

  const fetchReport = useCallback(async () => {
    try {
      const params = {};
      if (["movement", "purchases"].includes(tab)) {
        params.from_date = new Date(fromDate).toISOString();
        params.to_date = new Date(toDate + "T23:59:59").toISOString();
      }
      const { data } = await api.get(`/inventory/reports/${tab}`, { params });
      if (tab === "valuation") {
        setRows(data.items || []);
        setSummary({ total_cost_value: data.total_cost_value, total_retail_value: data.total_retail_value });
      } else {
        setRows(Array.isArray(data) ? data : []);
        setSummary(null);
      }
    } catch (e) {
      toast.error("Failed to load report");
    }
  }, [tab, fromDate, toDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const download = async (fmt) => {
    try {
      const token = await tokenStore.getAccess();
      const params = new URLSearchParams();
      if (["movement", "purchases"].includes(tab)) {
        params.set("from_date", new Date(fromDate).toISOString());
        params.set("to_date", new Date(toDate + "T23:59:59").toISOString());
      }
      const url = `${API}/inventory/reports/export/${tab}.${fmt}?${params.toString()}`;
      const res = await window.fetch(url, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `inventory_${tab}.${fmt}`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Exported ${fmt.toUpperCase()}`);
    } catch (e) {
      toast.error(e.message || "Export failed");
    }
  };

  const renderTable = () => {
    if (rows.length === 0) return <div className="py-12 text-center text-muted-foreground">No data available for this report</div>;

    const configs = {
      "current-stock": {
        headers: ["Product", "SKU", "Stock", "Reorder Lvl", "Cost", "Price", "Value"],
        render: (r) => [r.name, r.sku || "—", r.current_stock, r.reorder_level, `₹${r.unit_cost}`, `₹${r.price}`, `₹${r.stock_value}`],
      },
      "valuation": {
        headers: ["Product", "Stock", "Unit Cost", "Price", "Cost Value", "Retail Value"],
        render: (r) => [r.name, r.current_stock, `₹${r.unit_cost}`, `₹${r.price}`, `₹${r.cost_value}`, `₹${r.retail_value}`],
      },
      "movement": {
        headers: ["Product", "Current Stock", "Total In", "Total Out", "Net"],
        render: (r) => [r.name, r.current_stock, <span className="text-forest font-semibold">+{r.total_in}</span>, <span className="text-red-500 font-semibold">-{r.total_out}</span>, <span className={`font-bold ${r.net >= 0 ? 'text-forest' : 'text-red-500'}`}>{r.net >= 0 ? '+' : ''}{r.net}</span>],
      },
      "low-stock": {
        headers: ["Product", "Current Stock", "Reorder Level", "Min Stock", "Deficit"],
        render: (r) => [r.name, <span className="text-amber-600 font-bold">{r.current_stock}</span>, r.reorder_level, r.min_stock, <span className="text-red-500 font-bold">{r.deficit}</span>],
      },
      "dead-stock": {
        headers: ["Product", "Stock", "Unit Cost", "Stock Value", "Days No Sale"],
        render: (r) => [r.name, r.current_stock, `₹${r.unit_cost}`, `₹${r.stock_value}`, <Badge variant="outline" className="text-red-500 border-red-200">{r.days_no_sale}d</Badge>],
      },
      "purchases": {
        headers: ["PO #", "Supplier", "Status", "Total", "Created", "Received"],
        render: (r) => [
          r.po_number, r.supplier_name,
          <Badge variant="outline" className="text-[10px] capitalize">{r.status}</Badge>,
          `₹${r.total_amount?.toLocaleString("en-IN")}`,
          r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—",
          r.received_at ? new Date(r.received_at).toLocaleDateString("en-IN") : "—",
        ],
      },
    };

    const config = configs[tab] || configs["current-stock"];

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {config.headers.map((h, i) => (
                <th key={i} className="pb-3 pr-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const cells = config.render(r);
              return (
                <tr key={r.id || i} className="border-b border-border last:border-0 hover:bg-sand-subtle/30">
                  {cells.map((cell, j) => (
                    <td key={j} className="py-2.5 pr-3 font-mono text-xs">{cell}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t("inv_module") || "Inventory Management"}</div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("inv_reports") || "Inventory Reports"}</h1>
      </div>

      {/* Report tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-border rounded-md mb-4 w-fit">
        {REPORT_TABS.map(rt => (
          <button key={rt.key} onClick={() => setTab(rt.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              tab === rt.key ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground"
            }`}>
            <rt.icon className="w-3.5 h-3.5" /> {rt.label}
          </button>
        ))}
      </div>

      {/* Date filters for applicable reports */}
      {["movement", "purchases"].includes(tab) && (
        <div className="flex items-center gap-3 mb-4">
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40 bg-white" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40 bg-white" />
        </div>
      )}

      {/* Summary for valuation */}
      {tab === "valuation" && summary && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="p-4 border-border shadow-none">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Cost Value</div>
            <div className="font-display text-2xl font-extrabold text-terracota mt-1">₹{summary.total_cost_value?.toLocaleString("en-IN")}</div>
          </Card>
          <Card className="p-4 border-border shadow-none">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Retail Value</div>
            <div className="font-display text-2xl font-extrabold text-forest mt-1">₹{summary.total_retail_value?.toLocaleString("en-IN")}</div>
          </Card>
        </div>
      )}

      {/* Report data + export */}
      <Card className="border-border shadow-none">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-sm text-muted-foreground">{rows.length} records</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => download("csv")} className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => download("xlsx")} className="text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel
            </Button>
          </div>
        </div>
        <div className="p-4">
          {renderTable()}
        </div>
      </Card>
    </div>
  );
}
