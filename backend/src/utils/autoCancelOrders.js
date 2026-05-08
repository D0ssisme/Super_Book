import Order from "../models/Order.js";
// Thoi gian tu huy (phut) cho don thanh toan that bai.
const DEFAULT_CANCEL_MINUTES = 20;
// Thoi gian tu huy (ngay) cho don chua thanh toan.
const DEFAULT_UNPAID_CANCEL_DAYS = 1;
// chu kỳ job chạy (ms) để quét và hủy đơn quá hạn.
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

function parseDays(value, fallback) {
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
  const unpaidDays = parseDays(
    process.env.ORDER_AUTO_CANCEL_UNPAID_DAYS,
    DEFAULT_UNPAID_CANCEL_DAYS,
  );

  const cancelBefore = () => new Date(Date.now() - minutes * 60 * 1000);
  const cancelUnpaidBefore = () =>
    new Date(Date.now() - unpaidDays * 24 * 60 * 60 * 1000);

  const run = async () => {
    try {
      const failedCutoff = cancelBefore();
      const unpaidCutoff = cancelUnpaidBefore();
      const failedResult = await Order.updateMany(
        {
          purchaseStatus: "pending",
          // Chi huy don thanh toan that bai sau khi qua han.
          paymentStatus: "failed",
          paymentMethod: { $in: ["MOMO", "PAYOS"] },
          createdAt: { $lte: failedCutoff },
        },
        {
          $set: {
            purchaseStatus: "canceled",
            paymentStatus: "failed",
          },
        },
      );

      const unpaidResult = await Order.updateMany(
        {
          purchaseStatus: "pending",
          paymentStatus: "unpaid",
          paymentMethod: { $in: ["MOMO", "PAYOS"] },
          createdAt: { $lte: unpaidCutoff },
        },
        {
          $set: {
            purchaseStatus: "canceled",
            paymentStatus: "failed",
          },
        },
      );

      if (failedResult.modifiedCount > 0) {
        console.log(
          `[auto-cancel] Canceled ${failedResult.modifiedCount} failed order(s) before ${failedCutoff.toISOString()}`,
        );
      }

      if (unpaidResult.modifiedCount > 0) {
        console.log(
          `[auto-cancel] Canceled ${unpaidResult.modifiedCount} unpaid order(s) before ${unpaidCutoff.toISOString()}`,
        );
      }
    } catch (error) {
      console.error("[auto-cancel] Failed to cancel orders:", error.message);
    }
  };

  run();
  return setInterval(run, intervalMs);
}
