// EventBooks Model
import mongoose from 'mongoose';

const eventBooksSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    event_id: {
        type: Number,
        ref: 'Events',
        required: true
    },
    book_id: {
        type: Number,
        ref: 'Book',
        required: true
    }
});

const EventBooks = mongoose.model('EventBooks', eventBooksSchema);
export default EventBooks;