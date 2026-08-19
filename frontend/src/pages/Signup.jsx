import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Receipt, Loader2 } from "lucide-react";

export default function Signup() {
  const { user, ready, signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate("/", { replace: true });
  }, [ready, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await signup(email, password, restaurantName);
      navigate("/");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Signup failed. Email might already be in use.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-sand-app">
      <div className="hidden lg:block relative overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1707334724033-e997675f8c10?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt=""
          onError={(e) => { e.target.style.opacity = '0'; }}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span className="font-display font-extrabold tracking-tight text-lg">ANNDEVTA</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3 opacity-80">A billing counter for thali kitchens</div>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold leading-tight max-w-md">
              Start your journey.<br />
              <span className="text-terracota-light">Manage your kitchen.</span>
            </h1>
            <p className="mt-4 text-sm opacity-80 max-w-sm">
              Sign up today and get access to powerful billing, inventory, and payroll management tailored for thali restaurants.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 grid-bg">
        <Card className="w-full max-w-md p-8 border-border shadow-none">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Create Account</div>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Join Anndevta</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your details to create your restaurant workspace.</p>
          <form onSubmit={onSubmit} className="space-y-4" data-testid="signup-form">
            <div>
              <Label htmlFor="restaurantName" className="text-xs uppercase tracking-wider text-muted-foreground">Restaurant Name</Label>
              <Input id="restaurantName" type="text" placeholder="e.g. My Thali House" value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">{t("email")}</Label>
              <Input id="email" type="email" placeholder="owner@restaurant.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">{t("password")}</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" disabled={busy} data-testid="signup-submit"
              className="w-full bg-terracota hover:bg-terracota-hover text-white mt-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Sign Up
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-4">
            Already have an account? <Link to="/login" className="text-terracota hover:underline font-medium">Sign in</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
