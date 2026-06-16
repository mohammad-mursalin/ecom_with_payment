import API from '../axios';

export const getShippingEstimate = async (params = {}) => {
  const { subtotal, method = 'STANDARD' } = params;
  const response = await API.get('/shipping/estimate', { params: { subtotal, method } });
  return response.data;
};