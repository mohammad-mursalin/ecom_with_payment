import API from '../axios';

export const sendMessage = async ({ message, sessionToken, pageContext }) => {
  const response = await API.post('/chat', {
    message,
    sessionToken,
    pageContext,
  });
  return response.data.data;
};

export const submitFeedback = async ({ messageId, sessionToken, rating }) => {
  const response = await API.post(`/chat/messages/${messageId}/feedback`, {
    sessionToken,
    rating,
  });
  return response.data.data;
};
