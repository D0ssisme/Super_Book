// stores/cartStore.ts (Simple version)
import { create } from "zustand";
import { CartStore } from "@/types/cart.type";
import { cartServices, getOrCreateGuestSessionId, clearGuestSession } from "@/services/cartServices";
import { toast } from "sonner";

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  loading: false,
  error: null,
  selectedItemIds: [],
  checkoutItems: [],

  initializeGuestSession: () => {
    // Ensure guest session exists on app load
    getOrCreateGuestSessionId();
  },

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const result = await cartServices.fetchCart();
      set({ cart: result, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch cart",
        loading: false,
      });
      console.log(error);
    }
  },

  toggleSelectItem: (itemId: string) => {
    const currentSelected = get().selectedItemIds;
    if (currentSelected.includes(itemId)) {
      set({ selectedItemIds: currentSelected.filter(id => id !== itemId) });
    } else {
      set({ selectedItemIds: [...currentSelected, itemId] });
    }
  },

  selectAllItems: () => {
    const cart = get().cart;
    if (!cart) return;
    const allItemIds = cart.items.map(item => item._id);
    set({ selectedItemIds: allItemIds });
  },

  deselectAllItems: () => {
    set({ selectedItemIds: [] });
  },

  setSelectedItemIds: (itemIds: string[]) => {
    set({ selectedItemIds: itemIds });
  },

  setCheckoutItems: (itemIds: string[]) => {
    set({ checkoutItems: itemIds });
  },

  addToCart: async (bookId: string, quantity: number) => {
    try {
      await cartServices.addToCart(bookId, quantity);
      toast.success("Đã thêm sản phẩm vào giỏ hàng");
      await get().fetchCart();
    } catch (error) {
      console.error("error when adding to cart", error);
      throw error;
    }
  },

  updateCartItem: async (cartDetailId: string, quantity: number) => {
    const prevCart = get().cart;

    if (!prevCart) {
      await get().fetchCart();
      return get().updateCartItem(cartDetailId, quantity);
    }

    const itemToUpdate = prevCart.items.find(
      (item) => item._id === cartDetailId
    );

    if (!itemToUpdate) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    if (quantity < 1) {
      throw new Error("Số lượng phải lớn hơn 0");
    }

    const quantityChange = quantity - itemToUpdate.quantity;
    const priceChange = itemToUpdate.price * quantityChange;

    const newItems = prevCart.items.map((item) =>
      item._id === cartDetailId ? { ...item, quantity } : item
    );

    const optimisticCart = {
      ...prevCart,
      items: newItems,
      totalQuantity: prevCart.totalQuantity + quantityChange,
      totalPrice: prevCart.totalPrice + priceChange,
      updatedAt: new Date().toISOString(),
    };

    // Cập nhật state trước khi gọi API
    set({ cart: optimisticCart });

    try {
      await cartServices.updateCart(cartDetailId, quantity);
    } catch (error) {
      console.error(" Update cart item API error:", error);

      //  ROLLBACK: Nếu API fail, fetch lại cart từ server
      try {
        await get().fetchCart();
      } catch (fetchError) {
        console.error(" Failed to rollback:", fetchError);
        // Fallback: revert về cart cũ
        set({ cart: prevCart });
      }

      throw error;
    }
  },

  removeCartItem: async (cartDetailId: string) => {
    const prevCart = get().cart;

    if (!prevCart) {
      throw new Error("Cart not loaded");
    }

    const itemToRemove = prevCart.items.find(
      (item) => item._id === cartDetailId
    );

    if (!itemToRemove) {
      throw new Error("Item not found in cart");
    }

    const removedItemInfo = {
      ...itemToRemove,
      removedAt: new Date().toISOString(),
    };

    const newItems = prevCart.items.filter((item) => item._id !== cartDetailId);
    const itemTotalPrice = itemToRemove.price * itemToRemove.quantity;

    const optimisticCart = {
      ...prevCart,
      items: newItems,
      totalQuantity: prevCart.totalQuantity - itemToRemove.quantity,
      totalPrice: prevCart.totalPrice - itemTotalPrice,
      updatedAt: new Date().toISOString(),
    };

    set({ cart: optimisticCart, loading: true });

    try {
      await cartServices.removeCartItem(cartDetailId);

      set({ loading: false });

      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      console.error("Remove item error:", error);

      // ROLLBACK
      set({
        cart: prevCart,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to remove item",
      });

      throw error;
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null });
    try {
      await cartServices.clearCart();
      await get().fetchCart();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to clear cart",
        loading: false,
      });
      throw error;
    }
  },

  onLoginSuccess: async () => {
    // Called after successful login to merge guest cart with user cart
    console.log("Login successful, merging guest cart with user cart");
    
    const guestSessionId = localStorage.getItem('guest_session_id');
    
    if (guestSessionId) {
      try {
        // Merge guest cart to user cart on backend
        const mergedCart = await cartServices.mergeGuestCart(guestSessionId);
        set({ cart: mergedCart });
        
        // Clear guest session ID after successful merge
        clearGuestSession();
        console.log("Guest cart merged successfully");
      } catch (error) {
        console.error("Failed to merge guest cart:", error);
        // Still clear guest session even if merge fails
        clearGuestSession();
        // Fetch fresh cart from server
        await get().fetchCart();
      }
    } else {
      // No guest session, just fetch the user's cart
      await get().fetchCart();
    }
  },
}));
