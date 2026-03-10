// Order Model
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    order_id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
        ref: 'User',
        required: true
    },
    order_date: {
        type: Date,
        default: Date.now
    },
    total_price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    shipping_address: {
        type: String
    }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
