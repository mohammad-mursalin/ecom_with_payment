import API from '../axios';

export const getStats = async () => {
  const response = await API.get('/admin/stats');
  return response.data;
};

export const getUsers = async (params = {}) => {
  const response = await API.get('/admin/users', { params });
  return response.data;
};

export const getOrders = async (params = {}) => {
  const response = await API.get('/admin/orders', { params });
  return response.data;
};

export const updateOrderStatus = async (orderId, data) => {
  const response = await API.put(`/admin/orders/${orderId}/status`, data);
  return response.data.data;
};

export const updateUserRole = async (id, role) => {
  const response = await API.put(`/admin/users/${id}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await API.patch(`/admin/users/${id}/status`, { status });
  return response.data;
};

export const resendOrderEmail = async (orderId) => {
  const response = await API.post(`/admin/orders/${orderId}/resend-email`);
  return response.data;
};

export const getAnalytics = async (period = '30d') => {
  const response = await API.get('/admin/analytics/revenue', { params: { period } });
  return response.data;
};

export const getAnalyticsOrders = async (period = '30d') => {
  const response = await API.get('/admin/analytics/orders', { params: { period } });
  return response.data;
};

export const getAnalyticsProducts = async () => {
  const response = await API.get('/admin/analytics/products');
  return response.data;
};

export const getAnalyticsUsers = async () => {
  const response = await API.get('/admin/analytics/users');
  return response.data;
};

export const getAdminProducts = async (params = {}) => {
  const response = await API.get('/admin/products', { params });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await API.post('/admin/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await API.put(`/admin/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await API.delete(`/admin/products/${id}`);
  return response.data;
};

export const toggleProductActive = async (id) => {
  const response = await API.patch(`/admin/products/${id}/activate`);
  return response.data;
};