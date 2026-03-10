// BookCategories Model
import mongoose from 'mongoose';

const bookCategoriesSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    book_id: {
        type: Number,
        ref: 'Book',
        required: true
    },
    category_id: {
        type: Number,
        ref: 'Category',
        required: true
    }
});

const BookCategories = mongoose.model('BookCategories', bookCategoriesSchema);
export default BookCategories;