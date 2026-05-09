import api from "@/lib/axios";

// Get overview statistics
export const getOverviewStats = async (from = null, to = null) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/overview', { params });
    return response.data;
};

// Get revenue statistics
// period: 'day' | 'month' | 'year'
// from, to: date strings (YYYY-MM-DD)
export const getRevenueStats = async (period = 'month', from = null, to = null) => {
    const params = { period };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/revenue', { params });
    return response.data;
};

// Get profit statistics
export const getProfitStats = async (period = 'month', from = null, to = null) => {
    const params = { period };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/profit', { params });
    return response.data;
};

// Get top selling products
export const getTopProducts = async (limit = 10, from = null, to = null) => {
    const params = { limit };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/top-products', { params });
    return response.data;
};

// Get order statistics
export const getOrderStats = async () => {
    const response = await api.get('/statistics/orders');
    return response.data;
};

// Get top categories
export const getTopCategories = async (limit = 5, from = null, to = null) => {
    const params = { limit };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/top-categories', { params });
    return response.data;
};

// Get payment methods stats
export const getPaymentMethodsStats = async (from = null, to = null) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/payment-methods', { params });
    return response.data;
};

// Get comparison stats with previous period
export const getComparisonStats = async () => {
    const response = await api.get('/statistics/comparison');
    return response.data;
};

// Get order status statistics with date range filtering
export const getOrderStatusStats = async (from = '', to = '') => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/order-status', { params });
    return response.data;
};
