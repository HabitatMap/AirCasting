import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

const apiClient = axios.create({
  baseURL: process.env.API_STREAM_URL,
});

const oldApiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
});

const stagingApiClient = axios.create({
  baseURL: process.env.API_STAGING_URL,
});

apiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

oldApiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

export { apiClient, oldApiClient, stagingApiClient };
