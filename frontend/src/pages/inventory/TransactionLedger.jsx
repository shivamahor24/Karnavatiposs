import React, { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { BarChart3, Search, ArrowUpRight, ArrowDownRight, Package, RefreshCw, ArchiveX, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

const TX_TYPES = {
  sale: { label: "Sale", icon: ArrowDownRight, color: "text-blue-500", bg: "bg-blue-50" },
  purchase: { label: "Purchase", icon: ArrowUpRight, color: "text-forest", bg: "bg-forest-light" },
  adjustment: { label: "Adjustment", icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50" },
  damage: { label: "Damage/Loss", icon: ArchiveX, color: "text-red-500", bg: "bg-red-50" },
  return: { label: "Return", icon: ArrowUpRight, color: "text-purple-500", bg: "bg-purple-50" },
  transfer: { label: "Transfer", icon: ArrowRightLeft, color: "text-gray-500", bg: "bg-gray-100" },
};

export default function TransactionLedger() {
  const [txns, setTxns] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { t } = useLanguage();

  const fetch = useCallback(async () => {
    try {
      const params = {
        limit: 500,
        from_date: new Date(fromDate).toISOString(),
        to_date: new Date(toDate + "T23:59:59").toISOString(),
      };
      if (typeFilter !== "all") params.tx_type = typeFilter;
      const { data } = await api.get("/inventory/transactions", { params });
      setTxns(data);
    } catch { toast.error("Failed to load transactions"); }
  }, [typeFilter, fromDate, toDate]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = txns.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.product_name || "").toLowerCase().includes(q) || (t.reference_id || "").toLowerCase().includes(q) || (t.remarks || "").toLowerCase().includes(q);
  });

  const typeTabs = [{ key: "all", label: "All Types" }, ...Object.entries(TX_TYPES).map(([k, v]) => ({ key: k, label: v.label }))];

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t("inv_module") || "Inventory Management"}</div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("inv_ledger") || "Transaction Ledger"}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search product, ref, or remarks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white" />
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36 bg-white" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36 bg-white" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-border rounded-md mb-4 w-fit">
        {typeTabs.map(st => (
          <button key={st.key} onClick={() => setTypeFilter(st.key)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${
              typeFilter === st.key ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground"
            }`}>{st.label}</button>
        ))}
      </div>

      <Card className="border-border shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-sand-subtle/50">
                <th className="p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Date & Time</th>
                <th className="p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Type</th>
                <th className="p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Product</th>
                <th className="p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Qty Change</th>
                <th className="p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Reference</th>
                <th className="p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  No transactions found for the selected filters
                </td></tr>
              ) : filtered.map(tx => {
                const conf = TX_TYPES[tx.type] || { label: tx.type, icon: Package, color: "text-gray-500", bg: "bg-gray-100" };
                const Icon = conf.icon;
                return (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-sand-subtle/30">
                    <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] flex items-center w-fit gap-1 pr-2 ${conf.bg} border-transparent ${conf.color}`}>
                        <Icon className="w-3 h-3" /> {conf.label}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">{tx.product_name}</td>
                    <td className={`p-3 font-mono font-bold ${tx.qty_change > 0 ? 'text-forest' : 'text-red-500'}`}>
                      {tx.qty_change > 0 ? '+' : ''}{tx.qty_change}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{tx.reference_id || "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={tx.remarks}>{tx.remarks || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
