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
    usernames: string | null,
    sensorName: string,
    unitSymbol: string,
    sessionType: string
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
    unitSymbol,
    sessionType
  ) => {
    let url = `/${sessionType}/autocomplete/tags?q[input]=${encodeURIComponent(
      tag
    )}&q[west]=${encodeURIComponent(west)}&q[east]=${encodeURIComponent(
      east
    )}&q[south]=${encodeURIComponent(south)}&q[north]=${encodeURIComponent(
      north
    )}&q[time_from]=${encodeURIComponent(
      timeFrom
    )}&q[time_to]=${encodeURIComponent(
      timeTo
    )}&q[usernames]=${usernames}&q[sensor_name]=${encodeURIComponent(
      sensorName
    )}&q[unit_symbol]=${encodeURIComponent(unitSymbol)}`;

    if (sessionType === "fixed") {
      url += "&q[is_indoor]=false&q[is_active]=true";
    }

    return url;
  },
};
