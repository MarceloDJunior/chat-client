import axios from 'axios';
import { ACCESS_TOKEN } from '../constants/cookies';
import { CookiesHelper } from '../helpers/cookies';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
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
