import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchSessions, SessionsResponse } from "../api/fixedSessionsApi";
import { FixedSessionsTypes } from "../store/sessionFiltersSlice";
import { queryKeys } from "../utils/queryKeys";

export const useFixedSessions = (
  type: FixedSessionsTypes,
  options: { filters: string; enabled?: boolean }
) => {
  return useQuery<SessionsResponse, Error>({
    queryKey: queryKeys.fixedSessions.list(type, options.filters),
    queryFn: () => fetchSessions(type, options.filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: options.enabled,
  });
};

export const prefetchFixedSessions = (
  queryClient: QueryClient,
  type: FixedSessionsTypes,
  filters: string
) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.fixedSessions.list(type, filters),
    queryFn: () => fetchSessions(type, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCleanSessions = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fixedSessions.all });
    },
  });
};
