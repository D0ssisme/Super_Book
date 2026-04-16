import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import { getActiveEvent, getEffectiveBookPrice } from "../utils/pricing.js";

async function syncCartPricing(cart) {
  // Đồng bộ lại giá item theo event hiện tại trước khi cập nhật số lượng.
  const activeEvent = await getActiveEvent();
  const bookIds = cart.items.map((item) => item.bookId);

  if (bookIds.length === 0) {
    cart.totalQuantity = 0;
    cart.totalPrice = 0;
    return;
  }

  const books = await Book.find({ _id: { $in: bookIds } }).select(
    "price categoryId",
  );
  const bookPriceMap = new Map(
    books.map((book) => [
      String(book._id),
      getEffectiveBookPrice(book, activeEvent),
    ]),
  );

  cart.items = cart.items.map((item) => {
    const effectivePrice = bookPriceMap.get(String(item.bookId));
    if (typeof effectivePrice === "number") {
      item.price = effectivePrice;
    }
    return item;
  });

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
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
  const activeEvent = await getActiveEvent();
  const effectivePrice = getEffectiveBookPrice(book, activeEvent);

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
      cart.items[index].price = effectivePrice;
    } else {
      cart.items.push({ bookId, quantity: qty, price: effectivePrice });
    }
    await cart.save();
  }

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  await cart.save();

  return cart;
}

export async function updateItemQuantity(cartDetailId, customerId, quantity) {
  const cart = await Cart.findOne({ customerId });
  if (!cart) throw new Error("Cart not found");

  // Tránh lệch tổng tiền khi giá khuyến mãi thay đổi theo thời điểm.
  await syncCartPricing(cart);

  // Chuẩn hóa dữ liệu từ request (có thể lên dạng string).
  const qty = Number(quantity);

  const index = cart.items.findIndex(
    (item) => item._id && item._id.toString() === cartDetailId,
  );

  if (index === -1) {
    throw new Error("Item not found in cart");
  }

  if (Number.isNaN(qty) || qty < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const book = await Book.findById(cart.items[index].bookId);
  if (!book) {
    throw new Error("Book not found");
  }
  const activeEvent = await getActiveEvent();

  cart.items[index].quantity = qty;
  cart.items[index].price = getEffectiveBookPrice(book, activeEvent);

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
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
    (item) => item._id && item._id.toString() === cartDetailId,
  );

  if (itemIndex === -1) {
    throw new Error("Item not found in cart");
  }

  const removedItem = cart.items[itemIndex];
  cart.items.splice(itemIndex, 1);

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
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
  cart.totalQuantity = 0;
  cart.totalPrice = 0;
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
      totalPrice: 0,
    });
    await cart.save();
    return cart;
  }

  const activeEvent = await getActiveEvent();
  const bookIds = cart.items.map((item) => item.bookId);
  const books = await Book.find({ _id: { $in: bookIds } }).select(
    "price categoryId",
  );
  const bookPriceMap = new Map(
    books.map((book) => [
      String(book._id),
      getEffectiveBookPrice(book, activeEvent),
    ]),
  );

  cart.items = cart.items.map((item) => {
    const effectivePrice = bookPriceMap.get(String(item.bookId));
    if (typeof effectivePrice === "number" && item.price !== effectivePrice) {
      item.price = effectivePrice;
    }
    return item;
  });

  const computedQuantity = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const computedPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (
    cart.totalQuantity !== computedQuantity ||
    cart.totalPrice !== computedPrice
  ) {
    cart.totalQuantity = computedQuantity;
    cart.totalPrice = computedPrice;
    await cart.save();
  }

  return cart;
}
