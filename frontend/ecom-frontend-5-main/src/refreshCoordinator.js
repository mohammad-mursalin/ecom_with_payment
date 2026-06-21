import axios from 'axios';

let inFlightRefresh = null;

export const performRefresh = () => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = axios
    .post(
      `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    )
    .then((response) => response.data.data)
    .finally(() => {
      inFlightRefresh = null;
    });

  return inFlightRefresh;
};