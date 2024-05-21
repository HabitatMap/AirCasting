import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
});

const exportSessionApiClient = axios.create({
  baseURL: process.env.EXPORT_SESSION_API_BASE_URL,
});

apiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

exportSessionApiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

export { apiClient, exportSessionApiClient };
