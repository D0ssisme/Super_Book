import Event from "../models/Event.js";

export async function getActiveEvent() {
  const now = new Date();
  return Event.findOne({
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();
}

function hasIdInList(list = [], id) {
  const source = String(id || "");
  return Array.isArray(list) && list.some((item) => String(item) === source);
}

export function isBookEligibleForEvent(book, event) {
  if (!book || !event) return false;

  if (event.applyType === "all") return true;

  if (event.applyType === "products") {
    return hasIdInList(event.bookIds, book._id);
  }

  if (event.applyType === "categories") {
    return hasIdInList(event.categoryIds, book.categoryId);
  }

  return false;
}

export function getEffectiveBookPrice(book, event) {
  const basePrice = Number(book?.price || 0);
  if (!event || !isBookEligibleForEvent(book, event)) {
    return basePrice;
  }

  const discountPercent = Number(event.discountPercent || 0);
  if (discountPercent <= 0) return basePrice;

  return Math.max(0, Math.floor(basePrice * (1 - discountPercent / 100)));
}
