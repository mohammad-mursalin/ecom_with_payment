import API from '../axios';

export const getCart = async () => {
  const response = await API.get('/cart');
  return response.data;
};

export const addItem = async (productId, quantity) => {
  const response = await API.post('/cart/items', { productId, quantity });
  return response.data;
};

export const updateItem = async (cartItemId, quantity) => {
  const response = await API.put(`/cart/items/${cartItemId}`, { quantity });
  return response.data;
};

export const removeItem = async (cartItemId) => {
  const response = await API.delete(`/cart/items/${cartItemId}`);
  return response.data;
};

export const syncCart = async (items) => {
  const response = await API.post('/cart/sync', { items });
  return response.data;
};