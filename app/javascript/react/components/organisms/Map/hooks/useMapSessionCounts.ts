import { useMemo } from "react";
import { useAppSelector } from "../../../../store/hooks";
import { SessionTypes } from "../../../../types/filters";

interface UseMapSessionCountsProps {
  sessionType: typeof SessionTypes[keyof typeof SessionTypes];
}

export const useMapSessionCounts = ({
  sessionType,
}: UseMapSessionCountsProps) => {
  const fetchableMobileSessionsCount = useAppSelector(
    (state) => state.mobileSessions.fetchableSessionsCount
  );

  const fetchableFixedSessionsCount = useAppSelector(
    (state) => state.fixedSessions.fetchableSessionsCount
  );

  const fetchableSessionsCount = useMemo(() => {
    return sessionType === SessionTypes.FIXED
      ? fetchableFixedSessionsCount
      : fetchableMobileSessionsCount;
  }, [sessionType, fetchableFixedSessionsCount, fetchableMobileSessionsCount]);

  return {
    fetchableMobileSessionsCount,
    fetchableFixedSessionsCount,
    fetchableSessionsCount,
  };
};
