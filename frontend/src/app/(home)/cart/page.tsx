"use client";
import React, { useEffect, useRef } from "react";
import CartDetail from "./components/CartDetail";
import CartSummary from "./components/CartSummary";
import { useCartStore } from "@/stores/useCartStore";
import { useProductDeletionMonitor } from "@/hooks/useProductDeletionMonitor";

const PENDING_CHECKOUT_BOOK_IDS_KEY = "pending_checkout_book_ids";

const CartPage = () => {
  const cart = useCartStore((s) => s.cart);
  const setSelectedItemIds = useCartStore((s) => s.setSelectedItemIds);
  const restoredRef = useRef(false);

  // Monitor for deleted products
  useProductDeletionMonitor();

  useEffect(() => {
    if (restoredRef.current || !cart || cart.items.length === 0) return;

    const pendingRaw = window.localStorage.getItem(
      PENDING_CHECKOUT_BOOK_IDS_KEY,
    );

    if (!pendingRaw) return;

    try {
      const pendingBookIds: string[] = JSON.parse(pendingRaw);
      const restoredItemIds = cart.items
        .filter((item) => pendingBookIds.includes(item.bookId))
        .map((item) => item._id);

      if (restoredItemIds.length > 0) {
        setSelectedItemIds(restoredItemIds);
      }
    } catch (error) {
      console.error("Failed to restore checkout selection:", error);
    } finally {
      window.localStorage.removeItem(PENDING_CHECKOUT_BOOK_IDS_KEY);
      restoredRef.current = true;
    }
  }, [cart, setSelectedItemIds]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <CartDetail />
        <CartSummary />
      </div>
    </div>
  );
};

export default CartPage;

