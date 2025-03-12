import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

const ensureHttps = (url: string): string => {
  if (url && url.startsWith("http:")) {
    return url.replace("http:", "https:");
  }
  return url;
};

const API_BASE_URL = ensureHttps(process.env.API_BASE_URL || "");
const API_STREAM_URL = ensureHttps(process.env.API_STREAM_URL || "");

const apiClient = axios.create({
  baseURL: API_STREAM_URL,
});

const oldApiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("http:")) {
    config.url = config.url.replace("http:", "https:");
  }

  return config;
});

oldApiClient.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("http:")) {
    config.url = config.url.replace("http:", "https:");
  }

  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    response.data = camelizeKeys(response.data);
    return response;
  },
  (error) => {
    console.error(`API Error (apiClient): ${error.message}`, error);
    return Promise.reject(error);
  }
);

oldApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    response.data = camelizeKeys(response.data);
    return response;
  },
  (error) => {
    console.error(`API Error (oldApiClient): ${error.message}`, error);
    return Promise.reject(error);
  }
);

export { apiClient, oldApiClient };
