import React, { useEffect, useState, useMemo } from "react";
import api from "../lib/api";
import { Card } from "../components/ui/card";
import { TrendingUp, ShoppingBag, IndianRupee, Banknote, Smartphone, CreditCard, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from "recharts";
import { useLanguage } from "../context/LanguageContext";

const PAY_COLORS = { cash: "#78A61A", upi: "#FF7A2F", card: "#4F8EF7" };
const PAY_ICONS = { cash: Banknote, upi: Smartphone, card: CreditCard };

const Stat = ({ label, value, sub, accent, showCurrency = true}) => (
  <Card className="rounded-[26px] border-[#F4E6D7] bg-white shadow-sm p-6">
    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</div>
    <div className={`font-display text-3xl font-extrabold tracking-tight mt-2 flex items-center ${accent || ""}`}>
    {showCurrency && (
    <IndianRupee className="w-5 h-5 mr-0.5 text-muted-foreground" />
)}
      {value}
    </div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("today");
  const { t } = useLanguage();

  const periods = useMemo(() => [
    { key: "today", label: t("today") },
    { key: "week", label: t("this_week") },
    { key: "month", label: t("this_month") },
  ], [t]);

  useEffect(() => {
    const fetchSummary = () => api.get("/dashboard/summary").then((r) => setData(r.data)).catch(console.error);
    fetchSummary();
    const t = setInterval(fetchSummary, 20000);
    return () => clearInterval(t);
  }, []);

  if (!data) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const k = data[period];
  const topItems = data[`top_items_${period}`] || [];
  const topThalis = data[`top_thalis_${period}`] || [];
  const pay = data[`payment_${period}`] || { cash: 0, upi: 0, card: 0 };
  const payTotal = pay.cash + pay.upi + pay.card;

  const activePeriodLabel = periods.find(p => p.key === period)?.label || "";

  return (
    <div className="h-full
        bg-[#FFFDF9]
        rounded-[20px] md:rounded-[28px] lg:rounded-[32px]
        border
        border-[#F4E6D7]
        shadow-lg
        p-4 sm:p-5 md:p-6 lg:p-8
        overflow-y-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-[15px] uppercase tracking-[0.1em] font-bold bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] bg-clip-text text-transparent">{t("business_pulse")}</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">{t("nav_dashboard")}</h1>
        </div>
        <div className="flex items-center gap-5 p-3 bg-white border border-[#F4E6D7] rounded-full" data-testid="period-tabs">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} data-testid={`period-${p.key}`}
              className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${period === p.key ? "bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-foreground"
                }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] uppercase tracking-[0.1em] font-semibold mb-3" data-testid="kpi-cards">
        <Stat label={t("revenue_card")} value={k.revenue.toLocaleString('en-IN')} accent="text-[#FF6B00]" />
        <Stat label={t("orders_card")} value={k.orders}  showCurrency={false} />
        <Stat label={t("avg_bill_card")} value={k.avg.toLocaleString('en-IN')} sub={t("per_receipt")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Card className="lg:col-span-2
        rounded-[26px]
        border-[#F4E6D7]
        bg-white
        shadow-sm
        p-6">
          <div className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mb-1">{t("last_7_days")}</div>
          <h3 className="font-display text-lg font-semibold mb-4">{t("sales_trend")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5C5C5C' }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 11, fill: '#5C5C5C' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E4DE', fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#FF7A2F" strokeWidth={3.5} dot={{ r: 4, stroke:"#FF7A2F", strokeWidth:2, fill:"white" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[30px]
        border-[#F4E6D7]
        bg-white
        shadow-sm
        p-6">
          <div className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mb-1">{activePeriodLabel}</div>
          <h3 className="font-display text-lg font-semibold mb-4">{t("payment_mix")}</h3>
          {payTotal === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">{t("no_payments_yet")}</div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { mode: t("cash"), amount: pay.cash },
                    { mode: t("upi"), amount: pay.upi },
                    { mode: t("card"), amount: pay.card },
                  ]} layout="vertical" margin={{ left: 8 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="mode" tick={{ fontSize: 12 }} width={50} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E6E4DE', fontSize: 12 }} />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                      <Cell fill={PAY_COLORS.cash} />
                      <Cell fill={PAY_COLORS.upi} />
                      <Cell fill={PAY_COLORS.card} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {Object.entries(pay).map(([mode, amt]) => {
                  const Icon = PAY_ICONS[mode];
                  const pct = payTotal > 0 ? Math.round((amt / payTotal) * 100) : 0;
                  return (
                    <div key={mode} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" style={{ color: PAY_COLORS[mode] }} /> {t(mode)}
                      </span>
                      <span className="font-mono">₹{amt.toLocaleString('en-IN')} <span className="text-muted-foreground">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 border-border shadow-none">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            <div className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground"> {activePeriodLabel.toLowerCase()}</div>
          </div>
          <h3 className="font-display text-lg text-[25px] font-semibold mb-4">{t("top_thalis")}</h3>
          <ul className="space-y-2" data-testid="top-thalis">
            {topThalis.length === 0 ? <li className="text-sm text-muted-foreground">{t("no_thalis_sold")}</li> : topThalis.map((it, i) => (
              <li key={it.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-terracota-light text-[#FF6B00] flex items-center justify-center text-xs font-bold font-mono">{i + 1}</span>
                  <span className="font-medium text-sm">{t(it.name)}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold">{it.qty}</div>
                  <div className="font-mono text-[13px] text-muted-foreground">₹{it.revenue}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 border-border shadow-none">
          <div className="flex items-center gap-2 mb-1">
          
          <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
            <div className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground">  {activePeriodLabel.toLowerCase()}</div>
          </div>
          <h3 className="font-display text-lg font-semibold mb-4">{t("top_products")}</h3>
          <ul className="space-y-2" data-testid="top-items">
            {topItems.length === 0 ? <li className="text-sm text-muted-foreground">{t("no_items_sold")}</li> : topItems.map((it, i) => (
              <li key={it.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-forest-light text-forest flex items-center justify-center text-xs font-bold font-mono">{i + 1}</span>
                  <span className="font-medium text-sm">{t(it.name)}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold">{it.qty}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">₹{it.revenue}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
