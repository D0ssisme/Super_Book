import api from "@/lib/axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// Get all supply receipts with pagination and filter
// Query params: page, limit, status
export const getAllSupplyReceipts = async (params = {}) => {
    const response = await api.get('/supply-receipts', { params });
    return response.data;
};

// Get supply receipt by ID
export const getSupplyReceiptById = async (id) => {
    const response = await api.get(`/supply-receipts/${id}`);
    return response.data;
};

// Create new supply receipt
// Body: { supplierId, details: [{ bookId, importPrice, quantity }] }
export const createSupplyReceipt = async (data) => {
    const response = await api.post('/supply-receipts', data);
    return response.data;
};

// Update supply receipt
// Body: { supplierId, purchaseStatus, supplyDate, details }
export const updateSupplyReceipt = async (id, data) => {
    const response = await api.put(`/supply-receipts/${id}`, data);
    return response.data;
};

// Update supply receipt status only
// Body: { purchaseStatus }
export const updateSupplyReceiptStatus = async (id, purchaseStatus) => {
    const response = await api.patch(`/supply-receipts/${id}/status`, { purchaseStatus });
    return response.data;
};

// Get supply receipt statistics
export const getSupplyReceiptStats = async () => {
    const response = await api.get('/supply-receipts/stats');
    return response.data;
};
