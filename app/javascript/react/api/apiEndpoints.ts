import { ParamsType, SessionType } from "../types/filters";

interface ApiEndpoints {
  readonly exportSessionData: (sessionsIds: number[], email: string) => string;
  readonly fetchCrowdMap: (filters: string) => string;
  readonly fetchActiveFixedSessions: (filters: string) => string;
  readonly fetchDormantFixedSessions: (filters: string) => string;
  readonly fetchFixedStreamById: (id: number) => string;
  readonly fetchMobileSessions: (filters: string) => string;
  readonly fetchMobileStreamById: (id: number) => string;
  readonly fetchRectangleData: (filters: string) => string;
  readonly fetchSelectedDataRangeOfStream: (
    id: number,
    startDate: string,
    endDate: string
  ) => string;
  readonly fetchThresholds: (filters: string) => string;
  readonly fetchUsernames: (params: ParamsType) => string;
  readonly fetchTags: (params: ParamsType) => string;
  readonly fetchSensors: (sessionType: SessionType) => string;
  readonly fetchTimelapseData: (filters: string) => string;
  readonly fetchIndoorActiveSessions: (filters: string) => string;
  readonly fetchIndoorDormantSessions: (filters: string) => string;
  readonly fetchMeasurements: (
    streamId: number,
    startTime: string,
    endTime: string
  ) => string;
}

export const API_ENDPOINTS: ApiEndpoints = {
  exportSessionData: (sessionsIds: number[], email: string) => {
    const sessionParams = sessionsIds
      .map((id) => `session_ids[]=${id}`)
      .join("&");
    return `/sessions/export.json?${sessionParams}&email=${email}`;
  },
  fetchCrowdMap: (filters) => `/averages2.json?q=${filters}`,
  fetchActiveFixedSessions: (filters) =>
    `/fixed/active/sessions2.json?q=${filters}`,
  fetchDormantFixedSessions: (filters) =>
    `/fixed/dormant/sessions.json?q=${filters}`,
  fetchFixedStreamById: (id) => `/fixed_streams/${id}`,
  fetchMobileSessions: (filters) => `/mobile/sessions.json?q=${filters}`,
  fetchMobileStreamById: (id) => `/mobile/streams/${id}`,
  fetchRectangleData: (filters) => `/region.json?${filters}`,
  fetchSelectedDataRangeOfStream: (id, startDate, endDate) =>
    `/stream_daily_averages?stream_id=${id}&start_date=${startDate}&end_date=${endDate}`,
  fetchThresholds: (filters) => `/thresholds/${filters}`,
  fetchUsernames: (params) => {
    const {
      usernames,
      tags,
      west,
      east,
      south,
      north,
      timeFrom,
      timeTo,
      sensorName,
      unitSymbol,
      isIndoor,
      isActive,
      sessionType,
    } = params;

    if (
      west === undefined ||
      east === undefined ||
      south === undefined ||
      north === undefined ||
      timeFrom === undefined ||
      timeTo === undefined ||
      sensorName === undefined ||
      unitSymbol === undefined ||
      isIndoor === undefined ||
      isActive === undefined ||
      tags === undefined
    ) {
      throw new Error("Missing required parameters.");
    }

    const query: Record<string, string | number | boolean> = {
      "q[input]": usernames || "",
      "q[west]": west,
      "q[east]": east,
      "q[south]": south,
      "q[north]": north,
      "q[time_from]": timeFrom,
      "q[time_to]": timeTo,
      "q[sensor_name]": sensorName,
      "q[unit_symbol]": unitSymbol,
      "q[is_indoor]": isIndoor,
      "q[session_type]": sessionType,
      "q[is_dormant]": !isActive,
      "q[tags]": tags || "",
    };

    function encodeParamName(name: string): string {
      return name.replace(/[^A-Za-z0-9_\[\]]/g, encodeURIComponent);
    }

    const queryString = Object.keys(query)
      .map(
        (key) =>
          `${encodeParamName(key)}=${encodeURIComponent(String(query[key]))}`
      )
      .join("&");

    const url = `/autocomplete/usernames?${queryString}`;

    return url;
  },
  fetchTags: (params) => {
    const {
      tags,
      west,
      east,
      south,
      north,
      timeFrom,
      timeTo,
      usernames,
      sensorName,
      unitSymbol,
      isIndoor,
      isActive,
      sessionType,
    } = params;

    if (
      west === undefined ||
      east === undefined ||
      south === undefined ||
      north === undefined ||
      timeFrom === undefined ||
      timeTo === undefined ||
      sensorName === undefined ||
      unitSymbol === undefined ||
      isIndoor === undefined ||
      isActive === undefined
    ) {
      throw new Error("Missing required parameters.");
    }

    const query: Record<string, string | number | boolean> = {
      "q[input]": tags || "",
      "q[west]": west,
      "q[east]": east,
      "q[south]": south,
      "q[north]": north,
      "q[time_from]": timeFrom,
      "q[time_to]": timeTo,
      "q[usernames]": usernames || "",
      "q[sensor_name]": sensorName,
      "q[unit_symbol]": unitSymbol,
      "q[is_indoor]": isIndoor,
      "q[is_active]": isActive,
    };

    function encodeParamName(name: string): string {
      return name.replace(/[^A-Za-z0-9_\[\]]/g, encodeURIComponent);
    }

    const queryString = Object.keys(query)
      .map(
        (key) =>
          `${encodeParamName(key)}=${encodeURIComponent(String(query[key]))}`
      )
      .join("&");

    const url = `/${sessionType}/autocomplete/tags?${queryString}`;

    return url;
  },

  fetchSensors: (sessionType) => `/sensors?session_type=${sessionType}Session`,
  fetchTimelapseData: (filters) => `/timelapse.json?q=${filters}`,
  fetchIndoorActiveSessions: (filters) =>
    `/fixed/active/sessions2.json?q=${filters}`,
  fetchIndoorDormantSessions: (filters) =>
    `/fixed/dormant/sessions.json?q=${filters}`,
  fetchMeasurements: (streamId, startTime, endTime) =>
    `/fixed_measurements?stream_id=${streamId}&start_time=${startTime}&end_time=${endTime}`,
};
