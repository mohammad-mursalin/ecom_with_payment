import API from '../axios';

export const getChatSessions = async ({ search, startDate, endDate, escalatedOnly, hasUser, page = 0, pageSize = 20 }) => {
  const params = {
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(escalatedOnly !== undefined ? { escalatedOnly } : {}),
    ...(hasUser !== undefined ? { hasUser } : {}),
  };
  const response = await API.get('/admin/chat/sessions', { params });
  return response.data;
};

export const getChatSessionDetail = async (id) => {
  const response = await API.get(`/admin/chat/sessions/${id}`);
  return response.data;
};

export const getChatStats = async () => {
  const response = await API.get('/admin/chat/stats');
  return response.data;
};
