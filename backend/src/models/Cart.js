// Cart Model
import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    cart_id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
