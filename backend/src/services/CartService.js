import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import { getActiveEvents, getEffectiveBookPrice } from "../utils/eventPricing.js";

async function syncCartPricing(cart) {
  // Đồng bộ lại giá item theo event hiện tại trước khi cập nhật số lượng.
  const activeEvents = await getActiveEvents();
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
      getEffectiveBookPrice(book, activeEvents).price,
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

/**
 * Helper function to find cart by either customerId or guestSessionId
 */
function buildCartQuery(customerId, guestSessionId) {
  if (customerId) {
    return { customerId };
  } else if (guestSessionId) {
    return { guestSessionId };
  }
  throw new Error("Either customerId or guestSessionId is required");
}

/**
 * Helper function to build cart creation data
 */
function buildCartData(customerId, guestSessionId) {
  const data = { items: [], totalQuantity: 0, totalPrice: 0 };
  if (customerId) {
    data.customerId = customerId;
  } else if (guestSessionId) {
    data.guestSessionId = guestSessionId;
  }
  return data;
}

// chua cap nhat lai quantity book nhé
export async function addItemToCart(bookId, customerId, quantity, guestSessionId) {
  // Validate inputs
  if (!bookId) {
    throw new Error("bookId is required");
  }

  if (!customerId && !guestSessionId) {
    throw new Error("customerId or guestSessionId is required");
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
  const effectivePrice = getEffectiveBookPrice(book, activeEvents).price;

  const cartQuery = buildCartQuery(customerId, guestSessionId);
  let cart = await Cart.findOne(cartQuery);

  if (!cart) {
    // Create new cart if doesn't exist
    const cartData = buildCartData(customerId, guestSessionId);
    cart = new Cart({
      ...cartData,
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

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  await cart.save();

  return cart;
}

export async function updateItemQuantity(cartDetailId, customerId, quantity, guestSessionId) {
  const cartQuery = buildCartQuery(customerId, guestSessionId);
  const cart = await Cart.findOne(cartQuery);
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
  const activeEvents = await getActiveEvents();

  cart.items[index].quantity = qty;
  cart.items[index].price = getEffectiveBookPrice(book, activeEvents).price;

  cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  await cart.save();

  return cart;
}

export async function removeItemFromCart(cartDetailId, customerId, guestSessionId) {
  const cartQuery = buildCartQuery(customerId, guestSessionId);
  const cart = await Cart.findOne(cartQuery);
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

  return cart;
}

export async function clearCartService(customerId, guestSessionId) {
  const cartQuery = buildCartQuery(customerId, guestSessionId);
  const cart = await Cart.findOne(cartQuery);
  if (!cart) throw new Error("Cart not found");

  cart.items = [];
  cart.totalQuantity = 0;
  cart.totalPrice = 0;
  await cart.save();
  return cart;
}

export async function getCartService(customerId, guestSessionId) {
  const cartQuery = buildCartQuery(customerId, guestSessionId);
  let cart = await Cart.findOne(cartQuery);

  if (!cart) {
    // Create an empty cart if it doesn't exist
    const cartData = buildCartData(customerId, guestSessionId);
    cart = new Cart({
      ...cartData,
      items: [],
      totalQuantity: 0,
      totalPrice: 0,
    });
    await cart.save();
    return cart;
  }

  const activeEvents = await getActiveEvents();
  const bookIds = cart.items.map((item) => item.bookId);
  // Fetch all books, including isDeleted field
  const books = await Book.find({ _id: { $in: bookIds } }).select("price categoryId isDeleted");
  // Build a map of bookId to book object
  const bookMap = new Map(books.map((book) => [String(book._id), book]));

  // Remove items whose book is deleted
  const filteredItems = cart.items.filter((item) => {
    const book = bookMap.get(String(item.bookId));
    return book && !book.isDeleted;
  });

  // Update prices for remaining items
  const bookPriceMap = new Map(
    books.map((book) => [
      String(book._id),
      getEffectiveBookPrice(book, activeEvents).price,
    ]),
  );

  cart.items = filteredItems.map((item) => {
    const effectivePrice = bookPriceMap.get(String(item.bookId));
    if (typeof effectivePrice === "number" && item.price !== effectivePrice) {
      item.price = effectivePrice;
    }
    return item;
  });

  // Update totals
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
    cart.totalPrice !== computedPrice ||
    cart.items.length !== filteredItems.length
  ) {
    cart.totalQuantity = computedQuantity;
    cart.totalPrice = computedPrice;
    cart.markModified("items");
    await cart.save();
  }

  return cart;
}

/**
 * Merge guest cart items into user cart on login
 * @param {string} userId - Authenticated user ID
 * @param {string} guestSessionId - Guest session ID to merge from
 * @returns {object} Merged cart
 */
export async function mergeGuestCartToUserCart(userId, guestSessionId) {
  // Get guest cart
  const guestCart = await Cart.findOne({ guestSessionId });
  
  // Get or create user cart
  let userCart = await Cart.findOne({ customerId: userId });
  
  if (!userCart) {
    userCart = new Cart({
      customerId: userId,
      items: [],
      totalQuantity: 0,
      totalPrice: 0,
    });
  }

  if (guestCart && guestCart.items.length > 0) {
    // Merge items from guest cart
    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        (item) => item.bookId.toString() === guestItem.bookId.toString()
      );

      if (existingIndex > -1) {
        // Item already in user cart, add quantities
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        // New item, add to user cart
        userCart.items.push({
          bookId: guestItem.bookId,
          name: guestItem.name,
          quantity: guestItem.quantity,
          price: guestItem.price,
        });
      }
    }

    // Re-sync pricing for merged cart
    await syncCartPricing(userCart);
    await userCart.save();

    // Delete guest cart
    await Cart.deleteOne({ guestSessionId });
  }

  return userCart;
}

