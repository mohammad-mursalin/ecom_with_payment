import API from '../axios';

export const getProducts = async (params = {}) => {
  const response = await API.get('/products', { params });
  return response.data;
};

export const getProduct = async (id) => {
  const response = await API.get(`/product/${id}`);
  return response.data.data;
};

export const searchSuggestions = async (query, limit = 8) => {
  const response = await API.get('/products/search/suggestions', { params: { q: query, limit } });
  return response.data;
};

export const getFeaturedProducts = async (size = 8) => {
  const response = await API.get('/products/featured', { params: { size } });
  return response.data;
};

export const getRelated = async (productId) => {
  const response = await API.get(`/product/${productId}/related`);
  return response.data;
};

export const getAlsoBought = async (productId) => {
  const response = await API.get(`/product/${productId}/also-bought`);
  return response.data;
};

export const trackViewed = async (productId) => {
  const response = await API.post('/users/me/recently-viewed', { productId });
  return response.data;
};