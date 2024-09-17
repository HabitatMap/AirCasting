import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { FixedSessionsTypes } from "./sessionFiltersSlice";

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

interface SessionsResponse {
  fetchableSessionsCount: number;
  sessions: FixedSession[];
}

const fetchSessions = async (
  type: FixedSessionsTypes,
  filters: string
): Promise<SessionsResponse> => {
  const endpoint =
    type === FixedSessionsTypes.ACTIVE
      ? API_ENDPOINTS.fetchActiveFixedSessions
      : API_ENDPOINTS.fetchDormantFixedSessions;
  const response = await oldApiClient.get(endpoint(filters));
  return response.data;
};

export const useFixedSessions = (type: FixedSessionsTypes, filters: string) => {
  return useQuery<SessionsResponse, Error>({
    queryKey: ["fixedSessions", type, filters],
    queryFn: () => fetchSessions(type, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCleanSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixedSessions"] });
    },
  });
};
