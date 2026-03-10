// Category Model
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    category_id: {
        type: Number,
        required: true,
        unique: true
    },
    category_name: {
        type: String,
        required: true
    }
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
