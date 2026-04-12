import { validateCouponService } from "../services/CouponService.js";

export async function validateCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;
    const result = await validateCouponService(code, subtotal);
    return res.status(200).json({
      ok: true,
      coupon: {
        code: result.code,
        discountType: result.discountType,
        discountValue: result.discountValue,
        discountAmount: result.discountAmount,
      },
    });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
}
