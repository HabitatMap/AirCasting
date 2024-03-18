import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { selectThreshold } from "../store/thresholdSlice";
import { ThresholdsConfigurator } from "../components/ThresholdConfigurator";
import { Graph } from "../components/Graph";
import { WeekView } from "../components/WeekView/WeekView";
import { weeklyData } from "../components/WeekView/WeeklyMockData";
import { FixedStreamStationHeader } from "../components/molecules/FixedStreamStationHeader";
import { useAppDispatch } from "../store/hooks";
import { fetchFixedStreamById } from "../store/fixedStreamSlice";
import * as S from "./CalendarPage.style";

const CalendarPage = () => {
  const initialThresholds = useSelector(selectThreshold);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchFixedStreamById(6018));
  }, []);

  return (
    <S.CalendarPageLayout>
      <S.StationDataContainer>
        <FixedStreamStationHeader />
        <ThresholdsConfigurator initialThresholds={initialThresholds} />
        <Graph />
        <WeekView
          weeklyData={weeklyData}
          thresholdsValues={initialThresholds}
        />
      </S.StationDataContainer>
    </S.CalendarPageLayout>
  );
};
export { CalendarPage };
