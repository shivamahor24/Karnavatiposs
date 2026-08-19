import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { tokenStore } from "../lib/api";
import { offlineStorage } from "../lib/offlineStorage";

const log = (tag, message) => {
  console.log(`[${tag}]`, message);
  if (window.electronAPI && window.electronAPI.log) {
    try {
      window.electronAPI.log(tag, message);
    } catch (_) {}
  }
};

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // null = loading, false = anon, obj = signed in
  const [ready, setReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const checkAuth = useCallback(async () => {
    log("AUTH-CHECK", "Starting checkAuth sequence");
    setReady(false);
    
    // Read both tokens to trigger self-healing bidirectional sync on startup
    const refreshToken = await tokenStore.getRefresh();
    const accessToken = await tokenStore.getAccess();
    
    log("AUTH-CHECK", `Tokens loaded. Access present: ${!!accessToken}, Refresh present: ${!!refreshToken}`);

    // Fast-path: if there's no token at all, skip the network call
    if (!accessToken) {
      log("AUTH-CHECK", "No stored access token — checking offline cache");
      const cachedUser = offlineStorage.loadUser();
      if (cachedUser) {
        log("AUTH-CHECK", `Loaded cached user for offline mode: ${cachedUser.email}`);
        setUser(cachedUser);
        setIsOffline(true);
      } else {
        log("AUTH-CHECK", "No cached user found. Setting anonymous");
        setUser(false);
        setIsOffline(false);
      }
      setReady(true);
      return;
    }

    try {
      log("AUTH-CHECK", "Verifying session with /auth/me …");
      const { data } = await api.get("/auth/me");
      log("AUTH-CHECK", `Session verified. User: ${data.email}`);
      setUser(data);
      offlineStorage.saveUser(data); // cache for offline use
      setIsOffline(false);
    } catch (err) {
      if (!err.response) {
        // Network error — backend unreachable. Load cached user if available.
        log("AUTH-CHECK:WARN", "Backend unreachable — entering offline mode");
        const cachedUser = offlineStorage.loadUser();
        setUser(cachedUser || false);
        setIsOffline(true);
      } else if (err.response.status === 401 || err.response.status === 403) {
        // Server responded (e.g., 401/403) — check if refresh was already attempted
        // The axios interceptor automatically tries refresh before we get here.
        // If we still got 401/403, tokens are fully expired.
        const detail = err.response?.data?.detail || "unknown";
        log("AUTH-CHECK:WARN", `Auth check failed (unauthorized): status=${err.response.status}, detail=${detail}`);
        await tokenStore.clear();
        setUser(false);
        setIsOffline(false);
      } else {
        // Other server errors (5xx, etc.) — treat as temporary backend/network issues
        log("AUTH-CHECK:WARN", `Backend server error during auth check: status=${err.response.status}`);
        const cachedUser = offlineStorage.loadUser();
        setUser(cachedUser || false);
        setIsOffline(true);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // When network comes back, re-check auth silently
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline) {
        console.info("[AUTH] Network restored — re-checking auth");
        checkAuth();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isOffline, checkAuth]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    await tokenStore.setTokens(data.token, data.refresh_token);
    setUser(data.user);
    offlineStorage.saveUser(data.user);
    setIsOffline(false);
    console.info("[AUTH] Login successful — tokens stored");
    return data.user;
  };

  const googleSession = async (sessionId) => {
    const { data } = await api.get("/auth/session", { headers: { "X-Session-ID": sessionId } });
    await tokenStore.setTokens(data.token, data.refresh_token);
    setUser(data.user);
    offlineStorage.saveUser(data.user);
    console.info("[AUTH] Google session established");
    return data.user;
  };

  const logout = async () => {
    const refreshToken = await tokenStore.getRefresh();
    try {
      await api.post("/auth/logout", { refresh_token: refreshToken });
    } catch (err) {
      console.warn("[AUTH] Logout request failed:", err.message);
    }
    await tokenStore.clear();
    offlineStorage.clear();
    setUser(false);
    setIsOffline(false);
    console.info("[AUTH] Logged out — all tokens and cache cleared");
  };

  const signup = async (email, password, restaurant_name) => {
    await api.post("/auth/signup", { email, password, restaurant_name });
    return await login(email, password);
  };

  return (
    <AuthCtx.Provider value={{
      user, ready, isOffline,
      login, signup, googleSession, logout, setUser,
      retryConnection: checkAuth,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
