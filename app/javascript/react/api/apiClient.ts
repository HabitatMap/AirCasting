import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
});

export { apiClient };
