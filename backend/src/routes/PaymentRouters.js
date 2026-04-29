import express from "express";
import {
  cancelPayment,
  confirmPayment,
  createPayment,
  momoIpnController,
  momoReturnController,
  webhookController,
} from "../controllers/PaymentController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// PayOS routes currently disabled
router.post("/create/:id", auth, createPayment);
router.put("/confirm/:id", auth, confirmPayment);
router.get("/momo-return", momoReturnController);
router.post("/momo-ipn", momoIpnController);
router.post("/receive-hook", webhookController);
router.put("/cancel/:id", auth, cancelPayment);

export default router;
