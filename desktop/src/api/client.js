import axios from 'axios';

function getBaseURL() {
  try {
    const raw = localStorage.getItem('priorix_config');
    if (raw) {
      const { serverUrl } = JSON.parse(raw);
      if (serverUrl) return `${serverUrl}/api`;
    }
  } catch {}
  return 'http://localhost:3001/api';
}

const client = axios.create({ timeout: 10000 });

client.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
