import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchaseDate: { type: Date, default: Date.now },
    purchaseStatus: {
      type: String,
      enum: ["pending", "processing", "delivery", "completed", "canceled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "CARD", "PAYOS", "MOMO"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },
    subtotalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    totalAmount: { type: Number },
    paymentLink: { type: String },
    paymentLinkId: { type: String },
    payosOrderId: { type: Number },
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    receiverAddress: { type: String, required: true },
  },
  { timestamps: true },
);

orderSchema.plugin(mongoosePaginate);

orderSchema.virtual("details", {
  ref: "OrderDetail",
  localField: "_id",
  foreignField: "orderId",
});
orderSchema.set("toObject", { virtuals: true });
orderSchema.set("toJSON", { virtuals: true });
export default mongoose.model("Order", orderSchema);
