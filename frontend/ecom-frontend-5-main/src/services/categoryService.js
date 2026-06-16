import API from '../axios';

export const getCategories = async () => {
  const response = await API.get('/categories');
  return response.data;
};