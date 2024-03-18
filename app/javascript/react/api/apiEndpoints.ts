interface ApiEndpoints {
  readonly getFixedStream: (id: number) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  getFixedStream: (id) => `/fixed_streams/${id}`,
};
