import API from '../axios';

export const login = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (username, email, password, confirmPassword, fullName) => {
  const response = await API.post('/auth/register', { username, email, password, confirmPassword, fullName });
  return response.data;
};

export const logout = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};

// config param lets callers pass axios config flags (e.g. _isGuestCheck)
export const getProfile = async (config = {}) => {
  const response = await API.get('/auth/profile', config);
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await API.put('/auth/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
  const response = await API.put('/auth/password', { currentPassword, newPassword, confirmNewPassword });
  return response.data;
};

export const checkUsername = async (username) => {
  const response = await API.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
  return response.data;
};

export const checkEmail = async (email) => {
  const response = await API.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
  return response.data;
};

export const deleteAccount = async () => {
  const response = await API.delete('/auth/me');
  return response.data;
};