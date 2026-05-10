"use client";

import { AuthDialogProvider } from "@/components/auth-dialog-context";
import { AuthDialogGlobal } from "@/components/auth-dialog-global";
import { SWRProvider } from "@/components/provider/swr-provider";
import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { AccountLockDialog } from "@/components/account-lock-dialog";

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
        <AccountLockDialog />
        {children}
      </SWRProvider>
    </AuthDialogProvider>
  );
}
