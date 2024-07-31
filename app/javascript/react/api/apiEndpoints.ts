import { fetchTagsParamsType } from "../types/filters";

interface ApiEndpoints {
  readonly exportSessionData: (sessionsIds: string[], email: string) => string;
  readonly fetchClusterData: (streamIds: string[]) => string;
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
  readonly fetchTags: (params: fetchTagsParamsType) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  exportSessionData: (sessionsIds: string[], email: string) => {
    const sessionParams = sessionsIds
      .map((id) => `session_ids[]=${id}`)
      .join("&");
    return `/sessions/export.json?${sessionParams}&email=${email}`;
  },
  fetchClusterData: (streamIds) =>
    `/fixed_region.json?stream_ids=${streamIds.join(",")}`,
  fetchFixedSessions: (filters) => `/fixed/active/sessions2.json?q=${filters}`,
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
  fetchMobileSessions: (filters) => `/mobile/sessions.json?q=${filters}`,
  fetchMobileStreamById: (id) => `/mobile/streams/${id}`,
  fetchSelectedDataRangeOfStream: (id, startDate, endDate) =>
    `/stream_daily_averages?stream_id=${id}&start_date=${startDate}&end_date=${endDate}`,
  fetchThresholds: (filters) => `/thresholds/${filters}`,
  fetchUsernames: (username) => `/autocomplete/usernames?q[input]=${username}`,
  fetchTags: (params) => {
    let url = `/${
      params.sessionType
    }/autocomplete/tags?q[input]=${encodeURIComponent(
      params.tag
    )}&q[west]=${encodeURIComponent(params.west)}&q[east]=${encodeURIComponent(
      params.east
    )}&q[south]=${encodeURIComponent(
      params.south
    )}&q[north]=${encodeURIComponent(
      params.north
    )}&q[time_from]=${encodeURIComponent(
      params.timeFrom
    )}&q[time_to]=${encodeURIComponent(params.timeTo)}&q[usernames]=${
      params.usernames
    }&q[sensor_name]=${encodeURIComponent(
      params.sensorName
    )}&q[unit_symbol]=${encodeURIComponent(params.unitSymbol)}`;

    // TODO these fixed parameters are temporary and need to be passed from the component
    if (params.sessionType === "fixed") {
      url += "&q[is_indoor]=false&q[is_active]=true";
    }

    return url;
  },
};
