// Book Model
import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    book_id: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    image: {
        type: String
    }
});

const Book = mongoose.model('Book', bookSchema);
export default Book;
