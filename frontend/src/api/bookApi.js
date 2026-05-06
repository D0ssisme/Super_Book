import api from "@/lib/axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// Get all books with filters and pagination
// Query params: categoryId, maxPrice, sortBy (price_asc, price_desc, name_asc, name_desc), page, limit
export const getAllBooks = async (params = {}) => {
    const response = await axios.get(`${apiUrl}/books`, { params });
    return response.data;
};

// Get book by ID
export const getBookById = async (id) => {
    const response = await axios.get(`${apiUrl}/books/${id}`);
    return response.data;
};

// Get max price of all books
export const getMaxPrice = async () => {
    const response = await axios.get(`${apiUrl}/books/max-price`);
    return response.data;
};

// Create new book (admin only, requires images)
export const createBook = async (formData) => {
    const response = await api.post('/books', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Update book (admin only, can include new images)
export const updateBook = async (id, formData) => {
    const response = await api.put(`/books/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Delete book (admin only)
export const deleteBook = async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
};
