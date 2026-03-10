// OrderCoupons Model
import mongoose from 'mongoose';

const orderCouponsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    order_id: {
        type: Number,
        ref: 'Order',
        required: true
    },
    coupon_id: {
        type: Number,
        ref: 'Coupons',
        required: true
    },
    discount_amount: {
        type: Number,
        required: true
    }
});

const OrderCoupons = mongoose.model('OrderCoupons', orderCouponsSchema);
export default OrderCoupons;