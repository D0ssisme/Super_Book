import {
  cancelPaymentService,
  confirmPaymentService,
  createPaymentService,
  handleMomoIpnService,
  handleMomoReturnService,
} from "../services/PaymentService.js";


export async function createPayment(req, res) {
  try {
    const payment = await createPaymentService(req.params.id, req.user.id, req);
    return res.status(200).json({ ok: true, payment });
  } catch (err) {
    return res.status(400).json({ ok: false, message: err.message });
  }
}
export async function webhookController(req, res) {
  return res
    .status(501)
    .json({ message: "PayOS webhook is currently disabled" });
}
export async function cancelPayment(req, res) {
  try {
    const order = await cancelPaymentService(req.params.id, req.user.id);
    return res.status(200).json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function confirmPayment(req, res) {
  try {
    const order = await confirmPaymentService(req.params.id, req.user.id);
    return res.status(200).json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function momoReturnController(req, res) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  try {
    const result = await handleMomoReturnService(req.query);
    if (result.status === "PAID") {
      return res.redirect(
        `${frontendUrl}/payment/return?status=PAID&orderCode=${encodeURIComponent(String(result.orderCode || ""))}`,
      );
    }
    // Gui reason ve frontend de hien thong bao phu hop.
    const reason = result.reason ? `&reason=${encodeURIComponent(String(result.reason))}` : "";
    return res.redirect(
      `${frontendUrl}/payment/cancel?status=FAILED&orderCode=${encodeURIComponent(String(result.orderCode || ""))}${reason}`,
    );
  } catch (err) {
    return res.redirect(
      `${frontendUrl}/payment/cancel?status=FAILED&message=${encodeURIComponent(err.message || "Payment verification failed")}`,
    );
  }
}

export async function momoIpnController(req, res) {
  try {
    await handleMomoIpnService(req.body);
    return res.status(200).json({ resultCode: 0, message: "Success" });
  } catch (err) {
    return res.status(200).json({
      resultCode: 1001,
      message: err.message || "MoMo callback failed",
    });
  }
}
