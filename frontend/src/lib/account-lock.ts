"use client";

export const ACCOUNT_LOCKED_EVENT = "superbook:account-locked";

export function notifyAccountLocked(message?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(ACCOUNT_LOCKED_EVENT, {
      detail: {
        message: message || "Tài khoản của bạn đã bị khóa",
      },
    }),
  );
}