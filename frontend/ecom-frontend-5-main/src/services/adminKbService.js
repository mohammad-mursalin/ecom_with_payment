import API from '../axios';

export const getKbArticles = async () => {
  const response = await API.get('/admin/kb');
  return response.data.data;
};

export const updateKbArticle = async (topic, content) => {
  const response = await API.put(`/admin/kb/${topic}`, { content });
  return response.data.data;
};
