import mongoose from 'mongoose';

const EventBookSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Composite unique index - each book can only be in one event at a time
EventBookSchema.index({ eventId: 1, bookId: 1 }, { unique: true });

export default mongoose.model('EventBook', EventBookSchema);
