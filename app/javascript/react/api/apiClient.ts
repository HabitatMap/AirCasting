import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

declare global {
  interface Window {
    APP_CONFIG: {
      API_STREAM_URL: string;
      API_BASE_URL: string;
    };
  }
}

const apiClient = axios.create({
  baseURL: window.APP_CONFIG.API_STREAM_URL,
});

const oldApiClient = axios.create({
  baseURL: window.APP_CONFIG.API_BASE_URL,
});

apiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);
  return response;
});

oldApiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);
  return response;
});

export { apiClient, oldApiClient };
