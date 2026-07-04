import API from '../axios';

export const validateCoupon = async ({ code, orderSubtotal }) => {
  const response = await API.post('/coupons/validate', { code, orderSubtotal });
  return response.data.data;
};