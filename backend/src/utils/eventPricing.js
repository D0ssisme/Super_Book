import Event from "../models/Event.js";

export async function getActiveEvents(now = new Date()) {
  return Event.find({
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();
}

function toId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

export function doesEventApplyToBook(book, event) {
  if (!book || !event) return false;

  const bookId = toId(book._id);
  const categoryId = toId(book.categoryId);

  if (event.applyType === "all") {
    return true;
  }

  if (event.applyType === "products") {
    return Array.isArray(event.bookIds)
      ? event.bookIds.some((id) => toId(id) === bookId)
      : false;
  }

  if (event.applyType === "categories") {
    return Array.isArray(event.categoryIds)
      ? event.categoryIds.some((id) => toId(id) === categoryId)
      : false;
  }

  return false;
}

export function getBestEventForBook(book, activeEvents = []) {
  let bestEvent = null;
  let maxDiscount = -1;

  for (const event of activeEvents) {
    if (!doesEventApplyToBook(book, event)) {
      continue;
    }

    const discount = Number(event.discountPercent) || 0;
    if (discount > maxDiscount) {
      maxDiscount = discount;
      bestEvent = event;
    }
  }

  return bestEvent;
}

export function calculateDiscountedPrice(basePrice, discountPercent = 0) {
  const price = Number(basePrice) || 0;
  const discount = Number(discountPercent) || 0;

  if (discount <= 0) {
    return price;
  }

  return Math.floor(price * (1 - discount / 100));
}

export function getEffectiveBookPrice(book, activeEvents = []) {
  const bestEvent = getBestEventForBook(book, activeEvents);
  const price = calculateDiscountedPrice(book?.price, bestEvent?.discountPercent || 0);

  return {
    price,
    event: bestEvent,
  };
}
