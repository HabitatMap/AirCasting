interface ApiEndpoints {
  readonly exportSessionData: (session_id: string, email: string) => string;
  readonly fetchFixedSessions: (filters: string) => string;
  readonly fetchFixedStreamById: (id: number) => string;
  readonly fetchMobileSessions: (filters: string) => string;
  readonly fetchMobileStreamById: (id: number) => string;
  readonly fetchSelectedDataRangeOfStream: (
    id: number,
    startDate: string,
    endDate: string
  ) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  exportSessionData: (sessionId, email) =>
    `/sessions/export.json?session_ids[]=${sessionId}&email=${email}`,
  fetchFixedSessions: (filters) => `/fixed/active/sessions2.json?q=${filters}`,
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
  fetchMobileSessions: (filters) => `/mobile/sessions.json?q=${filters}`,
  fetchMobileStreamById: (id) => `/mobile/streams/${id}`,
  fetchSelectedDataRangeOfStream: (id, startDate, endDate) =>
    `/stream_daily_averages?stream_id=${id}&start_date=${startDate}&end_date=${endDate}`,
};
