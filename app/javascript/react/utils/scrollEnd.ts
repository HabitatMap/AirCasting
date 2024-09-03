import { useCallback } from "react";
import { fetchDormantFixedSessions } from "../store/fixedSessionsSlice";
import { useAppDispatch } from "../store/hooks";
import { fetchMobileSessions } from "../store/mobileSessionsSlice";
import { SessionList } from "../types/sessionType";

export const useHandleScrollEnd = (
  offset: number,
  listSessions: SessionList[],
  updateOffset: (offset: number) => void,
  updateFetchedSessions: (count: number) => void,
  filters: string,
  fetchableMobileSessionsCount: number,
  fetchableFixedSessionsCount: number,
  isDormant: boolean
) => {
  const dispatch = useAppDispatch();

  const handleScrollEnd = useCallback(() => {
    const hasMoreSessions = listSessions.length < fetchableMobileSessionsCount;
    const hasMoreDormantSessions =
      isDormant && listSessions.length < fetchableFixedSessionsCount;

    if (hasMoreSessions) {
      const newOffset = offset + listSessions.length;
      updateOffset(newOffset);

      const updatedFilters = {
        ...JSON.parse(filters),
        offset: newOffset,
      };

      dispatch(
        fetchMobileSessions({
          filters: JSON.stringify(updatedFilters),
          isAdditional: true,
        })
      )
        .unwrap()
        .then((response) => {
          const totalFetchedSessions =
            listSessions.length + response.sessions.length;
          updateFetchedSessions(totalFetchedSessions);
        });
    }

    if (hasMoreDormantSessions) {
      const newOffset = offset + listSessions.length;
      updateOffset(newOffset);

      const updatedFilters = {
        ...JSON.parse(filters),
        offset: newOffset,
      };

      dispatch(
        fetchDormantFixedSessions({
          filters: JSON.stringify(updatedFilters),
        })
      )
        .unwrap()
        .then((response) => {
          const totalFetchedSessions =
            listSessions.length + response.sessions.length;
          updateFetchedSessions(totalFetchedSessions);
        });
    }
  }, [
    offset,
    listSessions.length,
    fetchableMobileSessionsCount,
    updateOffset,
    dispatch,
    filters,
    fetchableFixedSessionsCount,
    isDormant,
  ]);

  return handleScrollEnd;
};
