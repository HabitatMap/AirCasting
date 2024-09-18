// api/sessionsApi.ts

import { FixedSessionsTypes } from "../store/sessionFiltersSlice";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";
import { oldApiClient } from "./apiClient";
import { API_ENDPOINTS } from "./apiEndpoints";

export interface FixedSession {
  id: number;
  uuid: string;
  endTimeLocal: string;
  startTimeLocal: string;
  lastMeasurementValue: number;
  isIndoor: boolean;
  latitude: number;
  longitude: number;
  title: string;
  username: string;
  streams: {
    [key: string]: {
      streamDailyAverage: number;
      measurementShortType: string;
      sensorName: string;
      unitSymbol: string;
      id: number;
    };
  };
}

export interface SessionsResponse {
  fetchableSessionsCount: number;
  sessions: FixedSession[];
}

export const fetchSessions = async (
  type: FixedSessionsTypes,
  filters: string
): Promise<SessionsResponse> => {
  const endpoint =
    type === FixedSessionsTypes.ACTIVE
      ? API_ENDPOINTS.fetchActiveFixedSessions
      : API_ENDPOINTS.fetchDormantFixedSessions;

  try {
    const response = await await oldApiClient.get(endpoint(filters));
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    logError(error, {
      message,
      additionalInfo: {
        action: "fetchSessions",
        endpoint: endpoint(filters),
      },
    });
    throw error;
  }
};
