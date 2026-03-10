// Author Model
import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
    author_id: {
        type: Number,
        required: true,
        unique: true
    },
    author_name: {
        type: String,
        required: true
    }
});

const Author = mongoose.model('Author', authorSchema);
export default Author;
