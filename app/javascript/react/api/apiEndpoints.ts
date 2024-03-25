interface ApiEndpoints {
  readonly fetchFixedStreamById: (id: number) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
};
