import API from '../axios';

export const getReviews = async (productId, params = {}) => {
  const response = await API.get(`/reviews/product/${productId}`, { params });
  return response.data.data;
};

export const getMyReview = async (productId) => {
  const response = await API.get(`/reviews/my/${productId}`);
  return response.data.data;
};

export const checkEligibility = async (productId) => {
  const response = await API.get(`/reviews/check-eligibility/${productId}`);
  return response.data.data;
};

export const createReview = async (data) => {
  const response = await API.post('/reviews', data);
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await API.put(`/reviews/${id}`, data);
  return response.data;
};

export const voteReview = async (id, vote) => {
  const response = await API.post(`/reviews/${id}/vote`, { vote });
  return response.data;
};

export const reportReview = async (id, reason) => {
  const response = await API.post(`/reviews/${id}/report`, { reason });
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await API.delete(`/reviews/${id}`);
  return response.data;
};