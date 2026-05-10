"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getJWTfromCookie, removeJWTfromCookie } from "@/lib/cookies";
import { clearGuestSession } from "@/services/cartServices";
import { ACCOUNT_LOCKED_EVENT } from "@/lib/account-lock";
import api from "@/lib/axios";
import axios from "axios";
import { useSWRConfig } from "swr";
import { baseUrl } from "@/constants";

type AccountLockDetail = {
  message?: string;
};

export function AccountLockDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Tài khoản của bạn đã bị khóa");
  const [isHandling, setIsHandling] = useState(false);
  const handledRef = useRef(false);
  const router = useRouter();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const handleLocked = (event: Event) => {
      const customEvent = event as CustomEvent<AccountLockDetail>;
      handledRef.current = false;
      setMessage(customEvent.detail?.message || "Tài khoản của bạn đã bị khóa");
      setOpen(true);
    };

    window.addEventListener(ACCOUNT_LOCKED_EVENT, handleLocked);
    return () => window.removeEventListener(ACCOUNT_LOCKED_EVENT, handleLocked);
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    const checkLockedAccount = async () => {
      if (handledRef.current) return;

      const token = await getJWTfromCookie();
      if (!token) return;

      try {
        await api.get("/auth/profile");
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 403 &&
          error.response.data?.code === "ACCOUNT_LOCKED"
        ) {
          setMessage(error.response.data?.message || "Tài khoản của bạn đã bị khóa");
          setOpen(true);
        }
      }
    };

    void checkLockedAccount();
    timer = window.setInterval(checkLockedAccount, 5000);

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const handleConfirm = async () => {
    handledRef.current = true;
    setIsHandling(true);

    try {
      await removeJWTfromCookie();
      clearGuestSession();
      await mutate(`${baseUrl}/auth/profile`, null, false);
      setOpen(false);
      router.push("/");
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        }
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <DialogTitle className="text-2xl font-bold text-red-600">
            Tài khoản của bạn đã bị khóa
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            className="min-w-24"
            onClick={handleConfirm}
            disabled={isHandling}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}