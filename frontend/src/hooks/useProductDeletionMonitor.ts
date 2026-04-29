import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
    const router = useRouter();
    const pathname = usePathname();
    const cart = useCartStore((s) => s.cart);
    const fetchCart = useCartStore((s) => s.fetchCart);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasShownErrorRef = useRef(false);
    const deletedProductsRef = useRef<Set<string>>(getDeletedProductsFromSession());

    useEffect(() => {
        // Only start monitoring if there are items in the cart
        if (!cart || cart.items.length === 0) {
            return;
        }

        const checkProductsDeletion = async () => {
            try {
                let newDeletedProducts: string[] = [];

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
                        }
                    }
                }

                // If new products were deleted
                if (newDeletedProducts.length > 0 && !hasShownErrorRef.current) {
                    hasShownErrorRef.current = true;

                    // Save to session storage
                    saveDeletedProductsToSession(deletedProductsRef.current);

                    // Refetch cart to update with remaining items
                    await fetchCart();

                    const productNames = newDeletedProducts.join(", ");
                    const message = `Sản phẩm "${productNames}" đã bị xóa khỏi kho.`;

                    // Stop interval to prevent re-checking
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }

                    // Different handling based on current page
                    if (pathname === "/orders") {
                        // On checkout page - reload immediately
                        toast.error(message + " Trang sẽ được tải lại...", {
                            duration: 2000,
                        });
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else if (pathname === "/cart") {
                        // On cart page - reload to update display
                        toast.error(message + " Trang sẽ được tải lại...", {
                            duration: 2000,
                        });
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        // On other pages - show notification and update cart
                        toast.error(message, {
                            duration: 4000,
                        });
                        // Refetch cart data in background (already done above)
                    }

                    return;
                }
            } catch (error) {
                console.error("Error checking product deletion:", error);
            }
        };

        // Start polling every 5 seconds
        intervalRef.current = setInterval(checkProductsDeletion, 5000);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [cart, pathname, fetchCart]);
}


