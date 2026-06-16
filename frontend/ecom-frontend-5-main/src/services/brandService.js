import API from '../axios';

export const getBrands = async (params = {}) => {
  const response = await API.get('/brands', { params });
  return response.data;
};