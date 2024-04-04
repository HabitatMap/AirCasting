import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { selectThreshold } from "../store/thresholdSlice";
import { ThresholdsConfigurator } from "../components/ThresholdConfigurator";
import { FixedStreamStationHeader } from "../components/molecules/FixedStreamStationHeader";
import { Calendar } from "../components/molecules/Calendar";
import { useAppDispatch } from "../store/hooks";
import { fetchFixedStreamById } from "../store/fixedStreamSlice";
import * as S from "./CalendarPage.style";

const STREAM_ID_QUERY_PARAMETER_NAME = "streamId";

const CalendarPage = () => {
  const [searchParams] = useSearchParams();
  const streamIdQuery = searchParams.get(STREAM_ID_QUERY_PARAMETER_NAME);
  const streamId = streamIdQuery && Number(streamIdQuery);

  const initialThresholds = useSelector(selectThreshold);
  const dispatch = useAppDispatch();

  useEffect(() => {
    streamId && dispatch(fetchFixedStreamById(streamId));
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
