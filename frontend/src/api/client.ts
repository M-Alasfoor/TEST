import axios from 'axios';
import cfg from '../runtime-config.json';
import { getToken } from '../auth/cognito';

const api = axios.create({ baseURL: cfg.ApiUrl });
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default api;
