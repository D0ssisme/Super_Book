import Order from "../models/Order.js";
// Thoi gian tu huy (phut) neu don chua hoan tat thanh toan.
const DEFAULT_CANCEL_MINUTES = 10;
// hu kỳ job chạy (ms) để quét và hủy đơn quá hạn.
const DEFAULT_POLL_INTERVAL_MS = 30000;

function parseMinutes(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

function parseMs(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

export function startAutoCancelOrders() {
  const minutes = parseMinutes(
    process.env.ORDER_AUTO_CANCEL_MINUTES,
    DEFAULT_CANCEL_MINUTES,
  );
  const intervalMs = parseMs(
    process.env.ORDER_AUTO_CANCEL_POLL_MS,
    DEFAULT_POLL_INTERVAL_MS,
  );

  const cancelBefore = () => new Date(Date.now() - minutes * 60 * 1000);

  const run = async () => {
    try {
      const cutoff = cancelBefore();
      const result = await Order.updateMany(
        {
          purchaseStatus: "pending",
          // Chi huy don thanh toan that bai sau khi qua han.
          paymentStatus: "failed",
          paymentMethod: { $in: ["MOMO", "PAYOS"] },
          createdAt: { $lte: cutoff },
        },
        {
          $set: {
            purchaseStatus: "canceled",
            paymentStatus: "failed",
          },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[auto-cancel] Canceled ${result.modifiedCount} order(s) before ${cutoff.toISOString()}`,
        );
      }
    } catch (error) {
      console.error("[auto-cancel] Failed to cancel orders:", error.message);
    }
  };

  run();
  return setInterval(run, intervalMs);
}
