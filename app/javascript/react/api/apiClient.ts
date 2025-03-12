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

// Log the API URLs for debugging
console.log("API_BASE_URL:", API_BASE_URL);
console.log("API_STREAM_URL:", API_STREAM_URL);

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
  // Log the actual URL being requested
  console.log(
    `API Request (apiClient): ${config.method?.toUpperCase()} ${
      config.baseURL
    }${config.url}`
  );
  return config;
});

oldApiClient.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("http:")) {
    config.url = config.url.replace("http:", "https:");
  }
  // Log the actual URL being requested
  console.log(
    `API Request (oldApiClient): ${config.method?.toUpperCase()} ${
      config.baseURL
    }${config.url}`
  );
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
