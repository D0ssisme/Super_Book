import {
  addItemToCart,
  clearCartService,
  getCartService,
  removeItemFromCart,
  updateItemQuantity,
} from "../services/CartService.js";

export async function addItem(req, res) {
  try {
    const { bookId, quantity = 1 } = req.body;
    console.log("Add item request - bookId:", bookId, "quantity:", quantity, "userId:", req.user?.id);
    
    if (!bookId) {
      return res.status(400).json({ message: "bookId is required" });
    }
    
    const cart = await addItemToCart(bookId, req.user.id, quantity);
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
    const cart = await removeItemFromCart(id, req.user.id);
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
    const cart = await updateItemQuantity(id, req.user.id, quantity);
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
    const cart = await clearCartService(req.user.id);
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
    const cart = await getCartService(req.user.id);
    if (!cart) {
      return res.status(401).json({ message: "Cart not found" });
    }
    return res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
