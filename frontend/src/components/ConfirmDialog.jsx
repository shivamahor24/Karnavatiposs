import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, RotateCcw, Info } from "lucide-react";

export default function ConfirmDialog({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive" // "destructive" or "default"
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-2xl bg-white">
        {/* Top Gradient Accent Bar */}
        <div 
          className={`h-1.5 w-full ${
            isDestructive 
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" 
              : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
          }`} 
        />

        <div className="p-6">
          <DialogHeader className="p-0 space-y-0">
            <div className="flex items-start gap-4">
              {isDestructive ? (
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/15 via-rose-500/10 to-red-600/20 border border-red-200/80 flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 shadow-xs">
                  <Info className="w-6 h-6 text-orange-600" />
                </div>
              )}

              <div className="space-y-1">
                <DialogTitle className="text-xl font-extrabold text-slate-900 font-display tracking-tight text-left">
                  {title}
                </DialogTitle>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                  {isDestructive ? "Action Requires Confirmation" : "Confirmation Needed"}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Warning Message Box */}
          <div className="mt-4 mb-6">
            <div className={`p-4 rounded-xl border ${
              isDestructive 
                ? "bg-red-50/70 border-red-100 text-slate-700" 
                : "bg-amber-50/70 border-amber-100 text-slate-700"
            }`}>
              <DialogDescription className="text-sm font-medium leading-relaxed text-slate-700">
                {message}
              </DialogDescription>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="gap-2.5 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 h-10 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all duration-200 shadow-xs"
            >
              {cancelText}
            </Button>
            <Button 
              type="button"
              onClick={handleConfirm}
              className={`w-full sm:w-auto px-6 py-2.5 h-10 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] ${
                isDestructive 
                  ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 border border-red-500/30" 
                  : "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/25"
              }`}
            >
              {isDestructive && <RotateCcw className="w-4 h-4 mr-1.5" />}
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

