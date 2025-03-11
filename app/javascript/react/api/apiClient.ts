import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

// Helper function to ensure URLs use HTTPS
const ensureHttps = (url: string): string => {
  if (url && url.startsWith("http:")) {
    return url.replace("http:", "https:");
  }
  return url;
};

// Process environment variables to ensure HTTPS
const API_BASE_URL = ensureHttps(process.env.API_BASE_URL || "");
const API_STREAM_URL = ensureHttps(process.env.API_STREAM_URL || "");

const apiClient = axios.create({
  baseURL: API_STREAM_URL,
});

const oldApiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to ensure all URLs use HTTPS
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

apiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

oldApiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

export { apiClient, oldApiClient };
