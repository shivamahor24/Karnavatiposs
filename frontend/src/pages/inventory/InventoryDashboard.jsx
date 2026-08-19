import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Package, AlertTriangle, TrendingUp, IndianRupee, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Box, BarChart3, ClipboardList,
  Truck, FileBarChart, Bell, XCircle, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

const CHART_COLORS = ["#E06C4C", "#2D6A4F", "#457B9D", "#E9C46A", "#F4A261", "#264653", "#2A9D8F", "#E76F51", "#606C38", "#283618"];

const QuickLink = ({ to, icon: Icon, label, count, color }) => (
  <Link to={to} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-white hover:bg-sand-subtle transition-all group">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-foreground group-hover:text-terracota transition-colors">{label}</div>
      {count !== undefined && <div className="text-xs text-muted-foreground">{count} items</div>}
    </div>
    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-terracota transition-colors" />
  </Link>
);

export default function InventoryDashboard() {
  const [data, setData] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    api.get("/inventory/dashboard").then(r => setData(r.data)).catch(() => toast.error("Failed to load inventory dashboard"));
  }, []);

  if (!data) return <div className="p-10 text-muted-foreground">Loading inventory dashboard…</div>;

  const kpiCards = [
    { label: t("inv_total_value") || "Inventory Value", value: `₹${data.total_value.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-terracota", bg: "bg-terracota-light" },
    { label: "Today's Consumption", value: `${data.todays_consumption_kg || 0} kg`, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("inv_low_stock") || "Low Stock", value: data.low_stock_count, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t("inv_out_of_stock") || "Out of Stock", value: data.out_of_stock_count, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="h-full bg-[#FFFDF9] rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[32px] border border-[#F4E6D7] shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{t("inv_module") || "Inventory Management"}</div>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5">{t("inv_dashboard") || "Inventory Dashboard"}</h1>
          </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {kpiCards.map((k, i) => (
          <Card key={i} className="p-3.5 sm:p-4 md:p-5 border-border shadow-none">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k.label}</div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
            </div>
            <div className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight ${k.color}`}>{k.value}</div>
          </Card>
        ))}
      </div>

      {data.unmapped_items_count > 0 && (
        <div className="mb-4 md:mb-6 bg-amber-50 border border-amber-200 p-3.5 md:p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800 text-xs md:text-sm">Unmapped Menu Items Detected</h4>
            <p className="text-xs text-amber-700 mt-1">
              There are {data.unmapped_items_count} items in your menu that are missing a bulk inventory mapping (Portion Weight = 0). Selling these items will not deduct any inventory. Please update them in the Menu Editor.
            </p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 md:gap-3 mb-4 md:mb-6">
        <QuickLink to="/inventory/stock" icon={Box} label="Stock Management" color="bg-terracota-light text-terracota" />
        <QuickLink to="/inventory/suppliers" icon={Truck} label="Suppliers" color="bg-forest-light text-forest" />
        <QuickLink to="/inventory/purchase-orders" icon={ClipboardList} label="Purchase Orders" color="bg-blue-50 text-blue-600" />
        <QuickLink to="/inventory/reports" icon={FileBarChart} label="Reports" color="bg-amber-50 text-amber-600" />
        <QuickLink to="/inventory/transactions" icon={BarChart3} label="Transactions" color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Top Moving Products */}
        <Card className="p-6 border-border shadow-none lg:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Last 30 days</div>
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-terracota" /> Top Moving Products
          </h3>
          {data.top_movers.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No inventory movement recorded yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_movers.slice(0, 8)} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5C5C5C' }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#5C5C5C' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E4DE', fontSize: 12 }} />
                  <Bar dataKey="qty_sold" radius={[0, 6, 6, 0]} name="Units Sold">
                    {data.top_movers.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Alerts */}
        <Card className="p-6 border-border shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Stock Alerts
            </h3>
            <Badge variant="outline" className="text-xs">{data.alerts.length}</Badge>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.alerts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-forest" />
                All stock levels healthy
              </div>
            ) : data.alerts.map(a => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${a.alert_type === 'out_of_stock' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${a.alert_type === 'out_of_stock' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.product_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Stock: {a.current_stock} · Threshold: {a.threshold}
                  </div>
                </div>
                <Badge variant={a.alert_type === 'out_of_stock' ? 'destructive' : 'outline'} className="text-[10px] flex-shrink-0">
                  {a.alert_type === 'out_of_stock' ? 'OUT' : 'LOW'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 border-border shadow-none">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-secondary" /> Recent Inventory Activity
        </h3>
        {data.recent_activity.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">No inventory transactions recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Time</th>
                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Type</th>
                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Qty</th>
                  <th className="pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activity.slice(0, 10).map(tx => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className="text-[10px] capitalize">{tx.type}</Badge>
                    </td>
                    <td className={`py-2 pr-4 font-mono font-semibold ${tx.qty_change > 0 ? 'text-forest' : 'text-red-500'}`}>
                      {tx.qty_change > 0 ? '+' : ''}{tx.qty_change}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground truncate max-w-[200px]">{tx.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
    </div>
    </div>
  );
}
