import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchSessions, SessionsResponse } from "../api/fixedSessionsApi";
import { FixedSessionsTypes } from "../store/sessionFiltersSlice";
import { queryKeys } from "../utils/queryKeys";

export const useFixedSessions = (type: FixedSessionsTypes, filters: string) => {
  return useQuery<SessionsResponse, Error>({
    queryKey: queryKeys.fixedSessions.list(type, filters),
    queryFn: () => fetchSessions(type, filters),
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
