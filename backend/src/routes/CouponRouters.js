import express from "express";
import { auth } from "../middlewares/auth.js";
import { validateCoupon } from "../controllers/CouponController.js";

const router = express.Router();

router.post("/validate", auth, validateCoupon);

export default router;
