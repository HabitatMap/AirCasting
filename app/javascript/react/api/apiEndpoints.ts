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
  readonly fetchUsernames: (username: string) => string;
  readonly fetchTags: (
    tag: string,
    west: string,
    east: string,
    south: string,
    north: string,
    timeFrom: string,
    timeTo: string,
    usernames: string,
    sensorName: string,
    unitSymbol: string
  ) => string;
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
  fetchUsernames: (username) => `/autocomplete/usernames?q[input]=${username}`,
  fetchTags: (
    tag,
    west,
    east,
    south,
    north,
    timeFrom,
    timeTo,
    usernames,
    sensorName,
    unitSymbol
  ) =>
    `autocomplete/tags?q%5Binput%5D=w&q%5Bwest%5D=-107.39758549495609&q%5Beast%5D=-75.8009058074561&q%5Bsouth%5D=20.796447977133052&q%5Bnorth%5D=50.51291400943705&q%5Btime_from%5D=1687564800&q%5Btime_to%5D=1719273599&q%5Busernames%5D=&q%5Bsensor_name%5D=airbeam-pm2.5&q%5Bunit_symbol%5D=%C2%B5g%2Fm%C2%B3`,
};
