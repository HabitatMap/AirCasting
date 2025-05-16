import { useCallback } from "react";
import { fetchDormantFixedSessions } from "../../../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../../../store/hooks";
import { fetchMobileSessions } from "../../../../store/mobileSessionsSlice";
import { SessionTypes } from "../../../../types/filters";
import { SessionList } from "../../../../types/sessionType";

interface UseMapScrollEndProps {
  offset: number;
  listSessions: SessionList[];
  updateOffset: (offset: number) => void;
  updateFetchedSessions: (count: number) => void;
  filters: string;
  fetchableSessionsCount: number;
  isDormant: boolean;
  sessionType: typeof SessionTypes[keyof typeof SessionTypes];
}

export const useMapScrollEnd = ({
  offset,
  listSessions,
  updateOffset,
  updateFetchedSessions,
  filters,
  fetchableSessionsCount,
  isDormant,
  sessionType,
}: UseMapScrollEndProps) => {
  const dispatch = useAppDispatch();

  const handleScrollEnd = useCallback(() => {
    const hasMoreSessions = listSessions.length < fetchableSessionsCount;
    const hasMoreDormantSessions = isDormant && hasMoreSessions;

    if (hasMoreSessions) {
      const newOffset = offset + listSessions.length;
      updateOffset(newOffset);

      const updatedFilters = {
        ...JSON.parse(filters),
        offset: newOffset,
      };

      if (sessionType === SessionTypes.FIXED && hasMoreDormantSessions) {
        dispatch(
          fetchDormantFixedSessions({
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
      } else if (sessionType === SessionTypes.MOBILE) {
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
    }
  }, [
    offset,
    listSessions.length,
    fetchableSessionsCount,
    updateOffset,
    dispatch,
    filters,
    isDormant,
    sessionType,
  ]);

  return handleScrollEnd;
};
