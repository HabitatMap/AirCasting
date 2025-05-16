import { useMemo } from "react";
import { selectFixedSessionsList } from "../../../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../../../store/hooks";
import { selectIndoorSessionsList } from "../../../../store/indoorSessionsSelectors";
import { selectMobileSessionsList } from "../../../../store/mobileSessionsSelectors";
import { FixedSessionsTypes } from "../../../../store/sessionFiltersSlice";
import { SessionTypes } from "../../../../types/filters";

interface UseMapSessionListProps {
  sessionType: string;
  isIndoor: boolean;
  isDormant: boolean;
}

export const useMapSessionList = ({
  sessionType,
  isIndoor,
  isDormant,
}: UseMapSessionListProps) => {
  const selectListSessions = useMemo(
    () => (state: any) => {
      if (sessionType === SessionTypes.FIXED) {
        if (isIndoor) {
          return selectIndoorSessionsList(isDormant)(state);
        } else {
          return selectFixedSessionsList(state, FixedSessionsTypes.ACTIVE);
        }
      } else {
        return selectMobileSessionsList(state);
      }
    },
    [sessionType, isIndoor, isDormant]
  );

  const listSessions = useAppSelector(selectListSessions);

  return {
    listSessions,
  };
};
