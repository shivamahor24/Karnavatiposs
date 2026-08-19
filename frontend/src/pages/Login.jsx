import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Receipt, Loader2, Settings } from "lucide-react";
import { getBackendUrl } from "../lib/api";

export default function Login() {
  const { user, ready, login, retryConnection } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@pos.com");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);

  // Server settings state
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(getBackendUrl());

  useEffect(() => {
    if (ready && user) navigate("/", { replace: true });
  }, [ready, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("login_failed"));
    } finally { setBusy(false); }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const url = serverUrl.trim().replace(/\/$/, ""); // trim trailing slash
    localStorage.setItem("pos_backend_url", url);
    toast.success("Server URL saved! Re-testing connection...");
    setShowSettings(false);
    if (retryConnection) retryConnection();
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
              Punch the bill.<br />
              <span className="text-terracota-light">Feed the next guest.</span>
            </h1>
            <p className="mt-4 text-sm opacity-80 max-w-sm mb-12">
              Tap, total, print. Built for the speed of a real thali counter.
            </p>
            <div className="flex items-center gap-3 opacity-90">
              <img src={`${process.env.PUBLIC_URL}/tranferentlogo.png`} alt="Career Craftly" className="h-8" />
              <div className="text-xs">
                <div className="font-semibold">Powered by Career Craftly</div>
                <div className="opacity-75">Crafting Digital Success, Intelligently</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 grid-bg relative">
        {/* Settings Floating Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-6 right-6 p-2 rounded-full bg-white border border-border hover:bg-sand-subtle shadow-sm transition-all text-muted-foreground hover:text-foreground"
          title="Server Connection Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <Card className="w-full max-w-md p-8 border-border shadow-none relative">
          {showSettings ? (
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Configuration</div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Server Settings</h2>
              <p className="text-sm text-muted-foreground mb-6">Specify the local network or cloud API URL for your POS server.</p>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <Label htmlFor="serverUrl" className="text-xs uppercase tracking-wider text-muted-foreground">Server URL / IP</Label>
                  <Input
                    id="serverUrl"
                    placeholder="e.g. http://192.168.1.100:8000"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Leave blank to use relative API routes. Set your computer's local IP address if running backend on laptop.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 bg-terracota hover:bg-terracota-hover text-white">
                    Save Connection
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{t("sign_in")}</div>
              <h2 className="font-display text-2xl font-bold tracking-tight mb-1">{t("welcome_back")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("login_subtext")}</p>

              <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
                <div>
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">{t("email")}</Label>
                  <Input id="email" data-testid="login-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">{t("password")}</Label>
                  <Input id="password" data-testid="login-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
                </div>
                <Button type="submit" disabled={busy} data-testid="login-submit"
                  className="w-full bg-terracota hover:bg-terracota-hover text-white">
                  {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {t("sign_in")}
                </Button>
              </form>

              <div className="mt-6 text-xs text-muted-foreground border-b border-border pb-4">
                Demo: <code className="font-mono">admin@pos.com / admin123</code> &nbsp;·&nbsp; <code className="font-mono">cashier@pos.com / cashier123</code>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/signup" className="text-terracota hover:underline font-medium">Sign up</Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
