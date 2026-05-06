
//src/api/authorApi.js
import api from "@/lib/axios";

export const getAllAuthors = async () => {
    const response = await api.get('/authors');
    return response.data;
};

export const getAuthorById = async (id) => {
    const response = await api.get(`/authors/${id}`);
    return response.data;
};

export const createAuthor = async (data) => {
    const response = await api.post('/authors', data);
    return response.data;
};

export const updateAuthor = async (id, data) => {
    const response = await api.put(`/authors/${id}`, data);
    return response.data;
};

export const deleteAuthor = async (id) => {
    const response = await api.delete(`/authors/${id}`);
    return response.data;
};