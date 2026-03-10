// Events Model
import mongoose from 'mongoose';

const eventsSchema = new mongoose.Schema({
    event_id: {
        type: Number,
        required: true,
        unique: true
    },
    event_name: {
        type: String,
        required: true
    },
    discount_percent: {
        type: Number,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    }
});

const Events = mongoose.model('Events', eventsSchema);
export default Events;