interface ApiEndpoints {
  readonly exportSessionData: (sessionsIds: string[], email: string) => string;
  readonly fetchFixedSessions: (filters: string) => string;
  readonly fetchFixedStreamById: (id: number) => string;
  readonly fetchMobileSessions: (filters: string) => string;
  readonly fetchMobileStreamById: (id: number) => string;
  readonly fetchSelectedDataRangeOfStream: (
    id: number,
    startDate: string,
    endDate: string
  ) => string;
  readonly fetchThresholds: (filters: string) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  exportSessionData: (sessionsIds: string[], email: string) => {
    const sessionParams = sessionsIds
      .map((id) => `session_ids[]=${id}`)
      .join("&");
    return `/sessions/export.json?${sessionParams}&email=${email}`;
  },
  fetchFixedSessions: (filters) => `/fixed/active/sessions2.json?q=${filters}`,
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
  fetchMobileSessions: (filters) => `/mobile/sessions.json?q=${filters}`,
  fetchMobileStreamById: (id) => `/mobile/streams/${id}`,
  fetchSelectedDataRangeOfStream: (id, startDate, endDate) =>
    `/stream_daily_averages?stream_id=${id}&start_date=${startDate}&end_date=${endDate}`,
  fetchThresholds: (filters) => `/thresholds/${filters}`,
};
