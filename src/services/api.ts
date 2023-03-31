import axios from 'axios';
import { API_URL } from '@/config/environment';
import { ACCESS_TOKEN } from '@/constants/cookies';
import { CookiesHelper } from '@/helpers/cookies';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  function (config) {
    const accessToken = CookiesHelper.get(ACCESS_TOKEN);
    if (accessToken) {
      config.headers.Authorization =
        'Bearer ' + CookiesHelper.get(ACCESS_TOKEN);
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);
