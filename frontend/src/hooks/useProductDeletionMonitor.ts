import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bookServices } from "@/services/bookServices";
import { useCartStore } from "@/stores/useCartStore";

/**
 * Custom hook to monitor if any products in the cart are deleted
 * Polls every 5 seconds and reloads the page if a product is deleted
 */
export function useProductDeletionMonitor() {
    const router = useRouter();
    const cart = useCartStore((s) => s.cart);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasShownErrorRef = useRef(false);

    useEffect(() => {
        // Only start monitoring if there are items in the cart
        if (!cart || cart.items.length === 0) {
            return;
        }

        // Reset error flag when cart changes
        hasShownErrorRef.current = false;

        const checkProductsDeletion = async () => {
            try {
                // Check all products in cart
                for (const item of cart.items) {
                    try {
                        await bookServices.getBookById(item.bookId);
                    } catch (error: any) {
                        // Product was deleted (404 or 400 error)
                        if (error.status === 404 || error.status === 400) {
                            if (!hasShownErrorRef.current) {
                                hasShownErrorRef.current = true;

                                const productName = item.bookId || "sản phẩm";
                                toast.error(
                                    `Sản phẩm "${productName}" đã bị xóa khỏi kho. Trang sẽ được tải lại...`,
                                    {
                                        duration: 3000,
                                    }
                                );

                                // Stop interval
                                if (intervalRef.current) {
                                    clearInterval(intervalRef.current);
                                }

                                // Reload page after 2 seconds
                                setTimeout(() => {
                                    window.location.reload();
                                }, 2000);
                            }
                            return;
                        }
                    }
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
    }, [cart]);
}
