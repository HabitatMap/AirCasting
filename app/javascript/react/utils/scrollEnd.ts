import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchSessions, SessionsResponse } from "../api/fixedSessionsApi";
import { getFixedSessionsList } from "../helpers/fixedSessionsHelpers";
import { FixedSessionsTypes } from "../store/sessionFiltersSlice";
import { SessionList } from "../types/sessionType";

export const useHandleScrollEnd = (
  type: FixedSessionsTypes,
  filters: string
) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<SessionsResponse, Error>({
      queryKey: ["fixedSessions", type, filters],
      initialPageParam: 0,
      queryFn: ({ pageParam = 0 }) => {
        const updatedFilters = JSON.stringify({
          ...JSON.parse(filters),
          offset: pageParam,
        });
        return fetchSessions(type, updatedFilters);
      },
      getNextPageParam: (lastPage, allPages) => {
        const totalFetched = allPages.flatMap((page) => page.sessions).length;
        return totalFetched < lastPage.fetchableSessionsCount
          ? totalFetched
          : undefined;
      },
    });

  const handleScrollEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sessions: SessionList[] = data
    ? getFixedSessionsList(data.pages.flatMap((page) => page.sessions || []))
    : [];

  return {
    handleScrollEnd,
    sessions,
    isLoading: isFetchingNextPage,
  };
};
