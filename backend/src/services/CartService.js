import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import { getActiveEvents, getEffectiveBookPrice } from "../utils/eventPricing.js";

async function syncCartPricing(cart) {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return false;
  }

  const activeEvents = await getActiveEvents();
  const bookIds = [...new Set(cart.items.map((item) => item.bookId?.toString()).filter(Boolean))];

  if (bookIds.length === 0) {
    return false;
  }

  const books = await Book.find({ _id: { $in: bookIds } })
    .select("_id price categoryId")
    .lean();

  const booksById = new Map(books.map((book) => [book._id.toString(), book]));
  let changed = false;

  for (const item of cart.items) {
    const book = booksById.get(item.bookId?.toString());
    if (!book) continue;

    const { price: effectivePrice } = getEffectiveBookPrice(book, activeEvents);
    if (item.price !== effectivePrice) {
      item.price = effectivePrice;
      changed = true;
    }
  }

  return changed;
}

// chua cap nhat lai quantity book nhé
export async function addItemToCart(bookId, customerId, quantity) {
  // Validate inputs
  if (!bookId || !customerId) {
    throw new Error("bookId and customerId are required");
  }
  
  if (quantity === undefined || quantity === null) {
    throw new Error("quantity is required");
  }
  
  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1) {
    throw new Error("quantity must be a positive number");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error(`Book with id ${bookId} not found`);
  }

  const activeEvents = await getActiveEvents();
  const { price: effectivePrice } = getEffectiveBookPrice(book, activeEvents);
  
  // Use findOneAndUpdate to avoid duplicate key errors
  let cart = await Cart.findOne({ customerId: customerId });
  
  if (!cart) {
    // Create new cart if doesn't exist
    cart = new Cart({
      customerId: customerId,
      items: [{ bookId, quantity: qty, price: effectivePrice }],
    });
    await cart.save();
  } else {
    // Update existing cart
    const index = cart.items.findIndex((i) => i.bookId.equals(bookId));
    if (index > -1) {
      cart.items[index].price = effectivePrice;
      cart.items[index].quantity += qty;
    } else {
      cart.items.push({ bookId, quantity: qty, price: effectivePrice });
    }
    await cart.save();
  }
  
  return cart;
}

export async function updateItemQuantity(cartDetailId, customerId, quantity) {
  const cart = await Cart.findOne({ customerId });
  if (!cart) throw new Error("Cart not found");

  await syncCartPricing(cart);

  const index = cart.items.findIndex(
    (item) => item._id && item._id.toString() === cartDetailId
  );

  if (index === -1) {
    throw new Error("Item not found in cart");
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  cart.items[index].quantity = quantity;

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();

  return {
    cart,
    updatedItem: cart.items[index],
    message: "Item quantity updated successfully",
  };
}

export async function removeItemFromCart(cartDetailId, customerId) {
  const cart = await Cart.findOne({ customerId });
  if (!cart) throw new Error("Cart not found");

  const itemIndex = cart.items.findIndex(
    (item) => item._id && item._id.toString() === cartDetailId
  );

  if (itemIndex === -1) {
    throw new Error("Item not found in cart");
  }

  const removedItem = cart.items[itemIndex];
  cart.items.splice(itemIndex, 1);

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();

  return {
    cart,
    removedItem,
    message: "Item removed successfully",
  };
}
export async function clearCartService(customerId) {
  const cart = await Cart.findOne({ customerId });
  if (!cart) throw new Error("Cart not found");

  cart.items = [];
  await cart.save();
  return { message: "Cart cleared successfully" };
}

export async function getCartService(customerId) {
  let cart = await Cart.findOne({ customerId });
  if (!cart) {
    // Create an empty cart if it doesn't exist
    cart = new Cart({
      customerId: customerId,
      items: [],
      totalQuantity: 0,
      totalPrice: 0
    });
    await cart.save();
    return cart;
  }

  const changed = await syncCartPricing(cart);
  if (changed) {
    await cart.save();
  }

  return cart;
}
