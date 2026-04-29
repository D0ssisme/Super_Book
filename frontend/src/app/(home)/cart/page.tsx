"use client";
import React, { useEffect, useRef } from "react";
import CartDetail from "./components/CartDetail";
import CartSummary from "./components/CartSummary";
import useSWR from "swr";
import { cartServices } from "@/services/cartServices";
import { useCartStore } from "@/stores/useCartStore";
import { useProductDeletionMonitor } from "@/hooks/useProductDeletionMonitor";
import { bookServices } from "@/services/bookServices";
import { toast } from "sonner";

const PENDING_CHECKOUT_BOOK_IDS_KEY = "pending_checkout_book_ids";
const DELETED_PRODUCTS_SESSION_KEY = "deleted_products_session";

const CartPage = () => {
  const cart = useCartStore((s) => s.cart);
  const setSelectedItemIds = useCartStore((s) => s.setSelectedItemIds);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const restoredRef = useRef(false);
  const validatedRef = useRef(false);

  // Monitor for deleted products
  useProductDeletionMonitor();

  // Validate cart items on page load
  useEffect(() => {
    const validateCartItems = async () => {
      if (!cart || cart.items.length === 0 || validatedRef.current) {
        return;
      }

      validatedRef.current = true;

      // Get already deleted products from session
      let deletedProducts: string[] = [];
      try {
        const stored = sessionStorage.getItem(DELETED_PRODUCTS_SESSION_KEY);
        if (stored) {
          deletedProducts = JSON.parse(stored);
        }
      } catch {
        // Ignore errors
      }

      // Check if there are any newly deleted items (not already detected)
      let hasNewDeletedItems = false;
      const newDeletedProducts: string[] = [];

      // Check if all products in cart still exist
      for (const item of cart.items) {
        // Skip if already marked as deleted
        if (deletedProducts.includes(item.bookId)) {
          continue;
        }

        try {
          await bookServices.getBookById(item.bookId);
        } catch (error: any) {
          if (error.status === 404 || error.status === 400) {
            hasNewDeletedItems = true;
            newDeletedProducts.push(item.bookId);
            deletedProducts.push(item.bookId);
          }
        }
      }

      if (hasNewDeletedItems) {
        const productNames = newDeletedProducts.join(", ");
        toast.error(`Sản phẩm "${productNames}" đã bị xóa khỏi kho. Đang cập nhật giỏ hàng...`);

        // Update session storage
        try {
          sessionStorage.setItem(DELETED_PRODUCTS_SESSION_KEY, JSON.stringify(deletedProducts));
        } catch {
          // Ignore errors
        }

        // Refetch cart to remove deleted items
        await fetchCart();
      }
    };

    validateCartItems();
  }, [cart, fetchCart]);

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

