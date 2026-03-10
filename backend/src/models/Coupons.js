// Coupons Model
import mongoose from 'mongoose';

const couponsSchema = new mongoose.Schema({
    coupon_id: {
        type: Number,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount_type: {
        type: String,
        required: true
    },
    discount_value: {
        type: Number,
        required: true
    },
    min_order_value: {
        type: Number
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    usage_limit: {
        type: Number
    },
    status: {
        type: String,
        required: true
    }
});

const Coupons = mongoose.model('Coupons', couponsSchema);
export default Coupons;