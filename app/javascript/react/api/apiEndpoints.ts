interface ApiEndpoints {
  readonly fetchFixedStreamById: (id: number) => string;
  readonly exportSessionData: (session_id: string,  email: string) => string;
  readonly fetchMovingStreamPart: (id: number, startDate: string, endDate: string) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
  exportSessionData: (sessionId, email) => `/sessions/export.json?session_ids[]=${sessionId}&email=${email}`,
  fetchMovingStreamPart: (id, startDate, endDate) => `/stream_daily_averages/${id}?start_date=${startDate}&end_date=${endDate}`,
};
