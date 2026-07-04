import API from '../axios';

export const getAddresses = async () => {
  const response = await API.get('/users/me/addresses');
  return response.data.data;
};

export const createAddress = async (data) => {
  const response = await API.post('/users/me/addresses', data);
  return response.data.data;
};

export const updateAddress = async (id, data) => {
  const response = await API.put(`/users/me/addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id) => {
  const response = await API.delete(`/users/me/addresses/${id}`);
  return response.data.data;
};

export const setDefault = async (id) => {
  const response = await API.patch(`/users/me/addresses/${id}/default`);
  return response.data.data;
};