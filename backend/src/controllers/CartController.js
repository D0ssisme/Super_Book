import {
  addItemToCart,
  clearCartService,
  getCartService,
  removeItemFromCart,
  updateItemQuantity,
  mergeGuestCartToUserCart,
} from "../services/CartService.js";

export async function addItem(req, res) {
  try {
    const { bookId, quantity = 1 } = req.body;
    const customerId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    console.log("Add item request - bookId:", bookId, "quantity:", quantity, "userId:", customerId, "guestSessionId:", guestSessionId);
    
    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }
    
    const cart = await addItemToCart(bookId, customerId, quantity, guestSessionId);
    if (!cart) {
      return res.status(401).json({ message: "Cart not found" });
    }
    console.log("Add item success - cart items count:", cart.items?.length);
    return res.status(200).json(cart);
  } catch (err) {
    console.error("Add item error:", err.message);
    res.status(400).json({ message: err.message });
  }
}

export async function removeItem(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    const cart = await removeItemFromCart(id, customerId, guestSessionId);
    if (!cart) {
      return res.status(401).json({ message: "Cart not found" });
    }
    return res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateQuantity(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const customerId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    const cart = await updateItemQuantity(id, customerId, quantity, guestSessionId);
    if (!cart) {
      return res.status(401).json({ message: "Cart not found" });
    }
    return res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function clearCart(req, res) {
  try {
    const customerId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    const cart = await clearCartService(customerId, guestSessionId);
    if (!cart) {
      return res.status(401).json({ message: "Cart not found" });
    }
    return res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getCart(req, res) {
  try {
    const customerId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    const cart = await getCartService(customerId, guestSessionId);
    if (!cart) {
      return res.status(401).json({ message: "Cart not found" });
    }
    return res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Merge guest cart into user cart after login
 * Called after successful authentication to merge any guest cart items
 */
export async function mergeCart(req, res) {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { guestSessionId } = req.body;
    if (!guestSessionId) {
      return res.status(400).json({ message: "guestSessionId is required" });
    }

    console.log("Merging cart - userId:", customerId, "guestSessionId:", guestSessionId);
    const mergedCart = await mergeGuestCartToUserCart(customerId, guestSessionId);
    
    return res.status(200).json({
      message: "Cart merged successfully",
      cart: mergedCart,
    });
  } catch (err) {
    console.error("Merge cart error:", err.message);
    res.status(400).json({ message: err.message });
  }
}

