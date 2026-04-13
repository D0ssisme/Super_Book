import Coupon from "../models/Coupon.js";

export async function seedDefaultCoupon() {
  const existing = await Coupon.findOne({ code: "SUPER10" });
  if (existing) return;

  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(now.getFullYear() + 1);

  await Coupon.create({
    code: "SUPER10",
    description: "Giam 10% toi da 50.000d",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 50000,
    usageLimit: 0,
    usedCount: 0,
    startDate: now,
    endDate: nextYear,
    isActive: true,
  });

  console.log("Seeded default coupon SUPER10");
}
