import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, default: '' },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'pending',
    },
    moderationNote: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ userId: 1, bookId: 1 });

export default mongoose.model('Review', reviewSchema);
