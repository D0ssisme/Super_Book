import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, unique: true, sparse: true },
  guestSessionId: { type: String, required: false, unique: true, sparse: true },
  items: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }, 
      name: { type: String },
      quantity: { type: Number, min: 1 },
      price: { type: Number, required: true }
    }
  ],
  totalQuantity: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

// Validate that either customerId or guestSessionId is provided
cartSchema.pre('save', function (next) {
  if (!this.customerId && !this.guestSessionId) {
    throw new Error('Either customerId or guestSessionId must be provided');
  }
  
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  next()
})

export default mongoose.model('Cart', cartSchema);