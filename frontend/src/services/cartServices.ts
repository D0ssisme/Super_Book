import api from "@/lib/axios";
import { Cart } from "@/types/cart.type";

const GUEST_SESSION_KEY = "guest_session_id";

/**
 * Get or create guest session ID (should match backend)
 */
export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Clear guest session (called on successful login)
 */
export function clearGuestSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
}

export const cartServices = {
  fetchCart: async (): Promise<Cart> => {
    console.log("fetching cart...");
    try {
      const response = await api.get<Cart>("/cart");
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      console.error("Fetch cart error:", error.message);
      // Return empty cart on error for guests
      return {
        _id: "",
        customerId: "",
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
      };
    }
  },

  addToCart: async (bookId: string, quantity: number = 1): Promise<Cart> => {
    try {
      console.log("Adding to cart - bookId:", bookId, "quantity:", quantity);
      const response = await api.post<Cart>("/cart", {
        bookId,
        quantity,
      });
      console.log("Add to cart response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Add to cart error:", error.response?.status, error.response?.data);
      throw error;
    }
  },

  updateCart: async (cartDetailId: string, quantity: number): Promise<Cart> => {
    try {
      const response = await api.put<Cart>(`/cart/${cartDetailId}`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  removeCartItem: async (cartDetailId: string): Promise<Cart> => {
    try {
      const response = await api.delete<Cart>(`/cart/${cartDetailId}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  clearCart: async () => {
    try {
      const response = await api.delete("/cart");
      return response.status;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  mergeGuestCart: async (guestSessionId: string): Promise<Cart> => {
    try {
      console.log("Merging guest cart with session:", guestSessionId);
      const response = await api.post<any>("/cart/merge", { guestSessionId });
      console.log("Cart merge response:", response.data);
      return response.data.cart;
    } catch (error: any) {
      console.error("Merge cart error:", error.response?.status, error.response?.data);
      throw error;
    }
  },
};
