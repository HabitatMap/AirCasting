import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { FixedSessionsTypes } from "../store/sessionFiltersSlice";
import { ApiError } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { logError } from "../utils/logController";

interface IndoorSession {
  id: number;
  uuid: string;
  endTimeLocal: string;
  startTimeLocal: string;
  lastMeasurementValue: number;
  isIndoor: boolean;
  isActive: boolean;
  title: string;
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

interface SessionsResponse {
  fetchableSessionsCount: number;
  sessions: IndoorSession[];
}

const fetchIndoorSessions = async (
  type: FixedSessionsTypes,
  filters: string
): Promise<SessionsResponse> => {
  const endpoint =
    type === FixedSessionsTypes.ACTIVE
      ? API_ENDPOINTS.fetchActiveFixedSessions
      : API_ENDPOINTS.fetchDormantFixedSessions;

  try {
    const response: AxiosResponse<SessionsResponse> = await oldApiClient.get(
      endpoint(filters)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    const apiError: ApiError = {
      message,
      additionalInfo: {
        action: `fetch${
          type.charAt(0).toUpperCase() + type.slice(1)
        }IndoorSessions`,
        endpoint: endpoint(filters),
      },
    };
    logError(error, apiError);
    throw error;
  }
};

export const useIndoorSessions = (
  type: FixedSessionsTypes,
  filters: string
): UseQueryResult<SessionsResponse, Error> => {
  return useQuery<SessionsResponse, Error>({
    queryKey: ["indoorSessions", type, filters],
    queryFn: () => fetchIndoorSessions(type, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
