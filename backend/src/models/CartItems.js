// CartItems Model
import mongoose from 'mongoose';

const cartItemsSchema = new mongoose.Schema({
    cart_item_id: {
        type: Number,
        required: true,
        unique: true
    },
    cart_id: {
        type: Number,
        ref: 'Cart',
        required: true
    },
    book_id: {
        type: Number,
        ref: 'Book',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
});

const CartItems = mongoose.model('CartItems', cartItemsSchema);
export default CartItems;