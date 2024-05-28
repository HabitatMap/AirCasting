interface ApiEndpoints {
  readonly fetchFixedStreamById: (id: number) => string;
  readonly exportSessionData: (session_id: string,  email: string) => string;
  readonly fetchSelectedDataRangeOfStream: (id: number, startDate: string, endDate: string) => string;
  readonly fetchSessions: (q: string) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
  exportSessionData: (sessionId, email) => `/sessions/export.json?session_ids[]=${sessionId}&email=${email}`,
  fetchSelectedDataRangeOfStream: (id, startDate, endDate) => `/stream_daily_averages?stream_id=${id}&start_date=${startDate}&end_date=${endDate}`,
  fetchSessions: (q) => `/fixed/active/sessions2`,
};
