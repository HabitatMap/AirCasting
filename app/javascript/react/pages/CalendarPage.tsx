import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { selectThreshold } from "../store/thresholdSlice";
import { ThresholdsConfigurator } from "../components/ThresholdConfigurator";
import { FixedStreamStationHeader } from "../components/molecules/FixedStreamStationHeader";
import { Calendar } from "../components/molecules/Calendar";
import { useAppDispatch } from "../store/hooks";
import { fetchFixedStreamById } from "../store/fixedStreamSlice";
import * as S from "./CalendarPage.style";

// TODO read it from params
const STREAM_ID = 6018;

const CalendarPage = () => {
  const initialThresholds = useSelector(selectThreshold);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchFixedStreamById(STREAM_ID));
  }, []);

  return (
    <S.CalendarPageLayout>
      <S.StationDataContainer>
        <FixedStreamStationHeader />
        <ThresholdsConfigurator initialThresholds={initialThresholds} />
        <Calendar />
      </S.StationDataContainer>
    </S.CalendarPageLayout>
  );
};
export { CalendarPage };
