import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { bookServices } from "@/services/bookServices";
import { useCartStore } from "@/stores/useCartStore";

const DELETED_PRODUCTS_SESSION_KEY = "deleted_products_session";

/**
 * Get deleted products from session storage
 */
function getDeletedProductsFromSession(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = sessionStorage.getItem(DELETED_PRODUCTS_SESSION_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Save deleted products to session storage
 */
function saveDeletedProductsToSession(products: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DELETED_PRODUCTS_SESSION_KEY, JSON.stringify(Array.from(products)));
  } catch {
    // Ignore errors
  }
}

/**
 * Custom hook to monitor if any products in the cart are deleted
 * Polls every 5 seconds and handles deletion based on current page
 */
export function useProductDeletionMonitor() {
    const pathname = usePathname();
    const cart = useCartStore((s) => s.cart);
    const fetchCart = useCartStore((s) => s.fetchCart);
    const removeCartItem = useCartStore((s) => s.removeCartItem);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasShownErrorRef = useRef(false);
    const deletedProductsRef = useRef<Set<string>>(getDeletedProductsFromSession());
    const isCheckingRef = useRef(false);

    useEffect(() => {
        // Only start monitoring if there are items in the cart
        if (!cart || cart.items.length === 0) {
            return;
        }

        const checkProductsDeletion = async () => {
            if (isCheckingRef.current) return;
            isCheckingRef.current = true;
            try {
            let newDeletedProducts: string[] = [];
            const removedCartItemIds: string[] = [];

                // Check all products in cart
                for (const item of cart.items) {
                    // Skip if already marked as deleted
                    if (deletedProductsRef.current.has(item.bookId)) {
                        continue;
                    }

                    try {
                        await bookServices.getBookById(item.bookId);
                    } catch (error: any) {
                        // Product was deleted (404 or 400 error)
                        if (error.status === 404 || error.status === 400) {
                            newDeletedProducts.push(item.bookId);
                            deletedProductsRef.current.add(item.bookId);
                            removedCartItemIds.push(item._id);
                        }
                    }
                }

                // If new products were deleted
                if (newDeletedProducts.length > 0 && !hasShownErrorRef.current) {
                    hasShownErrorRef.current = true;

                    // Save to session storage
                    saveDeletedProductsToSession(deletedProductsRef.current);

                    // Remove deleted items from cart first
                    for (const cartItemId of removedCartItemIds) {
                        try {
                            await removeCartItem(cartItemId);
                        } catch (removeError) {
                            console.error("Failed to remove deleted item:", removeError);
                        }
                    }

                    // Refetch cart to update with remaining items
                    await fetchCart();

                    const productNames = newDeletedProducts.join(", ");
                    const message = `Sản phẩm "${productNames}" đã bị xóa khỏi kho.`;

                    // Always show toast regardless of page
                    toast.error(message, { duration: 3000 });

                    return;
                }
            } catch (error) {
                console.error("Error checking product deletion:", error);
            } finally {
                isCheckingRef.current = false;
            }
        };

        // Run once quickly then poll every 5 seconds
        checkProductsDeletion();
        intervalRef.current = setInterval(checkProductsDeletion, 5000);

        const handleFocus = () => {
            checkProductsDeletion();
        };

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                checkProductsDeletion();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [cart, pathname, fetchCart, removeCartItem]);
}


