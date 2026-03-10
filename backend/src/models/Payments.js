// Payments Model
import mongoose from 'mongoose';

const paymentsSchema = new mongoose.Schema({
    payment_id: {
        type: Number,
        required: true,
        unique: true
    },
    order_id: {
        type: Number,
        ref: 'Order',
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    payment_status: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_date: {
        type: Date,
        default: Date.now
    }
});

const Payments = mongoose.model('Payments', paymentsSchema);
export default Payments;