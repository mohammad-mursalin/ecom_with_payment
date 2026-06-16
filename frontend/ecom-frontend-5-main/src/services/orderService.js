import API from '../axios';

export const getOrders = async (params = {}) => {
  const response = await API.get('/orders', { params });
  return response.data;
};

export const getOrder = async (id) => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};

export const initiateOrder = async (data) => {
  const response = await API.post('/orders/initiate', data);
  return response.data;
};

export const confirmOrder = async (orderId) => {
  const response = await API.post(`/orders/${orderId}/confirm`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await API.put(`/orders/${orderId}/cancel`);
  return response.data;
};

export const updateOrderStatus = async (orderId, data) => {
  const response = await API.put(`/admin/orders/${orderId}/status`, data);
  return response.data;
};

export const resendOrderEmail = async (orderId) => {
  const response = await API.post(`/admin/orders/${orderId}/resend-email`);
  return response.data;
};

export const getAdminOrders = async (params = {}) => {
  const response = await API.get('/admin/orders', { params });
  return response.data;
};