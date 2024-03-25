import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
});

apiClient.interceptors.response.use((response: AxiosResponse) => {
  response.data = camelizeKeys(response.data);

  return response;
});

export { apiClient };
