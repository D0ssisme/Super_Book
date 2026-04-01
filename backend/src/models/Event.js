import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive', 'upcoming'], default: 'inactive' },
    // Apply type: all (toàn bộ), products (sản phẩm cụ thể), categories (danh mục cụ thể)
    applyType: { type: String, enum: ['all', 'products', 'categories'], default: 'all' },
    // Apply to specific books (if applyType = 'products')
    bookIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    // Apply to specific categories (if applyType = 'categories')
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Check if event is currently active
EventSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

export default mongoose.model('Event', EventSchema);
