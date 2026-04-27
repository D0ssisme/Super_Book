"use client";

import { AuthDialogProvider } from "@/components/auth-dialog-context";
import { AuthDialogGlobal } from "@/components/auth-dialog-global";
import { SWRProvider } from "@/components/provider/swr-provider";
import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartStore";

function GuestSessionInitializer() {
  const initializeGuestSession = useCartStore((s) => s.initializeGuestSession);

  useEffect(() => {
    // Initialize guest session ID on app load
    initializeGuestSession();
  }, [initializeGuestSession]);

  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthDialogProvider>
      <SWRProvider>
        <GuestSessionInitializer />
        <AuthDialogGlobal />
        {children}
      </SWRProvider>
    </AuthDialogProvider>
  );
}
