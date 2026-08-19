/**
 * TableGrid.jsx
 * Dine-in table status overview grid.
 * Shows N tables (N from settings.table_count) with status colour coding.
 * Used in Billing.jsx default view and dashboard.
 */
import React from "react";
import { UtensilsCrossed, Clock, CheckCircle } from "lucide-react";

const STATUS_CONFIG = {
  empty: {
    label: "Empty",
    bgClass: "bg-white border-[#F4E6D7] text-slate-500",
    activeBgClass: "bg-white border-[#FF6B00] text-[#FF6B00]",
    dot: "bg-slate-300",
    icon: null,
  },
  occupied: {
    label: "Occupied",
    bgClass: "bg-green-50 border-green-200 text-green-700",
    activeBgClass: "bg-green-100 border-green-400 text-green-800",
    dot: "bg-green-500",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    bgClass: "bg-amber-50 border-amber-200 text-amber-700",
    activeBgClass: "bg-amber-100 border-amber-400 text-amber-800",
    dot: "bg-amber-400",
    icon: Clock,
  },
};

export default function TableGrid({ tableCount = 5, tableStatuses = {}, activeTableId, onSelectTable }) {
  const tables = [];
  for (let i = 1; i <= tableCount; i++) {
    tables.push(String(i));
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
      {tables.map((id) => {
        const info = tableStatuses[id] || { status: "empty", itemCount: 0 };
        const cfg = STATUS_CONFIG[info.status] || STATUS_CONFIG.empty;
        const isActive = activeTableId === id;
        const StatusIcon = cfg.icon;

        return (
          <button
            key={id}
            onClick={() => onSelectTable(id)}
            data-testid={`table-btn-${id}`}
            className={`
              relative flex flex-col items-center justify-center
              min-h-[80px] p-2 rounded-2xl border-2 font-bold
              transition-all duration-150 select-none active:scale-95
              ${isActive ? cfg.activeBgClass + " shadow-md ring-2 ring-offset-1 ring-[#FF6B00]/40" : cfg.bgClass + " hover:shadow-sm hover:border-[#FF6B00]/40"}
            `}
          >
            {/* Status dot */}
            <div className={`absolute top-2 right-2.5 w-2 h-2 rounded-full ${cfg.dot}`} />

            {/* Table icon */}
            <UtensilsCrossed className={`w-5 h-5 mb-1 ${isActive ? "text-[#FF6B00]" : info.status === "empty" ? "text-slate-300" : ""}`} />

            {/* Table number */}
            <div className="text-base leading-tight">T{id}</div>

            {/* Status label */}
            <div className={`text-[10px] font-semibold mt-0.5 uppercase tracking-wide ${isActive ? "" : "opacity-70"}`}>
              {info.status === "empty" ? "Free" : info.status === "pending" ? "Hold" : `${info.itemCount} items`}
            </div>

            {/* Status icon badge */}
            {StatusIcon && (
              <StatusIcon className={`absolute bottom-1.5 right-1.5 w-3 h-3 ${info.status === "occupied" ? "text-green-500" : "text-amber-500"}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
