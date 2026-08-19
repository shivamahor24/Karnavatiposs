import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";

export default function PasswordChangeDialog({ open, onClose, isFirstLogin = false }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword === "admin123") {
      toast.error("Cannot use default password");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("Password changed successfully!");
      
      // Store flag that password has been changed
      localStorage.setItem("passwordChanged", "true");
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose(true); // Pass true to indicate success
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Password change failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isFirstLogin && !o && onClose(false)}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => isFirstLogin && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-terracota" />
            {isFirstLogin ? "Change Default Password" : "Change Password"}
          </DialogTitle>
          <DialogDescription>
            {isFirstLogin ? (
              <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <strong>Security Required:</strong> You must change the default password before accessing the system.
                </div>
              </div>
            ) : (
              "Update your password to keep your account secure."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1"
              autoFocus
              data-testid="current-password"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-1"
              data-testid="new-password"
            />
            <div className="text-[10px] text-muted-foreground mt-1">
              Must be at least 8 characters. Cannot be "admin123".
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-1"
              data-testid="confirm-password"
            />
          </div>
        </div>

        <DialogFooter>
          {!isFirstLogin && (
            <Button variant="outline" onClick={() => onClose(false)} className="border-border">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={busy}
            className="bg-terracota hover:bg-terracota-hover text-white"
            data-testid="change-password-btn"
          >
            {busy ? "Changing..." : "Change Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
