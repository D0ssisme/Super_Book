import api from "@/lib/axios";

export interface CouponValidationResult {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
}

export async function validateCoupon(code: string, subtotal: number) {
  return api
    .post("/coupons/validate", { code, subtotal })
    .then((res) => res.data as { ok: boolean; coupon: CouponValidationResult });
}
