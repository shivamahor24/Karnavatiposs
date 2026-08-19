import React from "react";
import { WifiOff, Server, RefreshCw } from "lucide-react";

export default function BackendOffline({ onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sand-app p-6">
      <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="font-display text-2xl font-extrabold text-foreground mb-2 text-center">
        Cannot Connect to Server
      </h1>
      <p className="text-muted-foreground text-sm text-center max-w-xs mb-6">
        The POS server is not reachable. Please make sure:
      </p>
      <div className="bg-white border border-border rounded-xl p-4 w-full max-w-xs mb-8 space-y-3">
        <div className="flex items-start gap-3">
          <Server className="w-4 h-4 text-terracota mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">
            The backend server is running on your device's network.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <WifiOff className="w-4 h-4 text-terracota mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">
            Your Android device is connected to the same Wi-Fi as the server.
          </p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-terracota text-white px-6 py-3 rounded-full font-semibold text-sm shadow-md active:scale-95 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Retry Connection
      </button>
    </div>
  );
}
