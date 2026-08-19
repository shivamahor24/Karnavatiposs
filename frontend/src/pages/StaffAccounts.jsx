import React from "react";
import StaffManager from "../components/StaffManager";

export default function StaffAccounts() {
  return (
    <div className="h-full bg-[#FFFDF9] rounded-[16px] sm:rounded-[20px] md:rounded-[24px] lg:rounded-[32px] border border-[#F4E6D7] shadow-lg p-3 sm:p-4 md:p-5 lg:p-8 flex flex-col overflow-hidden">
      <div className="h-full flex flex-col min-h-0">
        <div className="mb-2.5 md:mb-4 shrink-0">
          <div className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-[0.1em] font-bold bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] bg-clip-text text-transparent">
            TEAM MANAGEMENT
          </div>

          <h1 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Staff Accounts
          </h1>

          <p className="text-slate-500 mt-0.5 text-[11px] sm:text-xs md:text-xs lg:text-sm max-w-3xl">
            Manage staff accounts, roles and permissions for your restaurant.
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <StaffManager />
        </div>
      </div>
    </div>
  );
}
