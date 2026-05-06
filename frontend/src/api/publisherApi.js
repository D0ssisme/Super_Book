import api from "@/lib/axios";

export const getAllPublishers = async () => {
    const response = await api.get('/publishers');
    return response.data;
};

export const getPublisherById = async (id) => {
    const response = await api.get(`/publishers/${id}`);
    return response.data;
};

export const createPublisher = async (data) => {
    const response = await api.post('/publishers', data);
    return response.data;
};

export const updatePublisher = async (id, data) => {
    const response = await api.put(`/publishers/${id}`, data);
    return response.data;
};

export const deletePublisher = async (id) => {
    const response = await api.delete(`/publishers/${id}`);
    return response.data;
};
