import { useEffect, useMemo } from "react";
import {
  selectFixedSessionsPoints,
  selectFixedSessionsStatusFulfilled,
} from "../../../../store/fixedSessionsSelectors";
import { selectFixedData } from "../../../../store/fixedStreamSelectors";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  selectMobileSessionPointsBySessionId,
  selectMobileSessionsPoints,
} from "../../../../store/mobileSessionsSelectors";
import { selectMobileStreamPoints } from "../../../../store/mobileStreamSelectors";
import {
  FixedSessionsTypes,
  selectFixedSessionsType,
  selectIsDormantSessionsType,
  setFixedSessionsType,
} from "../../../../store/sessionFiltersSlice";
import {
  selectCurrentTimestamp,
  selectTimelapseData,
  selectTimelapseIsLoading,
} from "../../../../store/timelapseSelectors";

interface UseMapSessionsProps {
  sessionType: string;
  sessionId: number | null;
  streamId: number | null;
  isActive: boolean;
  isIndoor: boolean;
  currentUserSettings: string;
  fixedSessionTypeSelected: boolean;
}

export const useMapSessions = ({
  sessionId,
  isActive,
}: UseMapSessionsProps) => {
  const dispatch = useAppDispatch();
  const fixedSessionsType = useAppSelector(selectFixedSessionsType);
  const fixedPoints = useAppSelector((state) =>
    selectFixedSessionsPoints(state, fixedSessionsType)
  );
  const fixedSessionsStatusFulfilled = useAppSelector(
    selectFixedSessionsStatusFulfilled
  );
  const mobilePoints = sessionId
    ? useAppSelector(selectMobileSessionPointsBySessionId(sessionId))
    : useAppSelector(selectMobileSessionsPoints);
  const mobileStreamPoints = useAppSelector(selectMobileStreamPoints);
  const fixedStreamData = useAppSelector(selectFixedData);
  const timelapseData = useAppSelector(selectTimelapseData);
  const currentTimestamp = useAppSelector(selectCurrentTimestamp);
  const isDormant = useAppSelector(selectIsDormantSessionsType);
  const isTimelapseLoading = useAppSelector(selectTimelapseIsLoading);

  // Update fixed session type based on the URL
  useEffect(() => {
    if (isActive) {
      if (fixedSessionsType !== FixedSessionsTypes.ACTIVE) {
        dispatch(setFixedSessionsType(FixedSessionsTypes.ACTIVE));
      }
    } else {
      if (fixedSessionsType !== FixedSessionsTypes.DORMANT) {
        dispatch(setFixedSessionsType(FixedSessionsTypes.DORMANT));
      }
    }
  }, [isActive, fixedSessionsType, dispatch]);

  const memoizedTimelapseData = useMemo(() => timelapseData, [timelapseData]);

  return {
    fixedPoints,
    fixedSessionsStatusFulfilled,
    mobilePoints,
    mobileStreamPoints,
    fixedStreamData,
    timelapseData: memoizedTimelapseData,
    currentTimestamp,
    isDormant,
    isTimelapseLoading,
  };
};
