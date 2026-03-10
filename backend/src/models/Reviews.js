// Reviews Model
import mongoose from 'mongoose';

const reviewsSchema = new mongoose.Schema({
    review_id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
        ref: 'User',
        required: true
    },
    book_id: {
        type: Number,
        ref: 'Book',
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Reviews = mongoose.model('Reviews', reviewsSchema);
export default Reviews;