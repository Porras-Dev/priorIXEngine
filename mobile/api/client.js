import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const client = axios.create({ timeout: 10000 });

client.interceptors.request.use(async (config) => {
  const serverUrl = await SecureStore.getItemAsync('serverUrl');
  config.baseURL = serverUrl ? `${serverUrl}/api` : 'http://192.168.1.1:3001/api';
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      router.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default client;
