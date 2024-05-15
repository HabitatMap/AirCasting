import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

import { ThresholdsConfigurator } from "../../components/ThresholdConfigurator";
import { FixedStreamStationHeader } from "../../components/molecules/FixedStreamStationHeader";
import { Calendar } from "../../components/molecules/Calendar";
import { useAppDispatch } from "../../store/hooks";
import {
  fetchFixedStreamById,
  selectFixedData,
} from "../../store/fixedStreamSlice";
import {
  updateMovingStreamData,
  movingData,
} from "../../store/movingCalendarStreamSlice";
import * as S from "./CalendarPage.style";
import { screenSizes } from "../../utils/media";

const STREAM_ID_QUERY_PARAMETER_NAME = "streamId";

const CalendarPage = () => {
  const [searchParams] = useSearchParams();
  const streamIdQuery = searchParams.get(STREAM_ID_QUERY_PARAMETER_NAME);
  const streamId = streamIdQuery && Number(streamIdQuery);

  const fixedStreamData = useSelector(selectFixedData);
  const movingCalendarData = useSelector(movingData);
  const dispatch = useAppDispatch();

  const [isMobile, setIsMobile] = useState(
    window.innerWidth < screenSizes.mobile
  );

  useEffect(() => {
    streamId && dispatch(fetchFixedStreamById(streamId));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < screenSizes.mobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!fixedStreamData?.streamDailyAverages?.length) {
      console.log("No daily averages to process.");
      return;
    }
    const newMovingCalendarData = fixedStreamData.streamDailyAverages.map(
      ({ date, value }) => ({
        date,
        value,
      })
    );
    dispatch(updateMovingStreamData(newMovingCalendarData));
  }, [fixedStreamData, dispatch]);

  return (
    <S.CalendarPageLayout>
      <S.StationDataContainer>
        <FixedStreamStationHeader />
        {!isMobile && <ThresholdsConfigurator />}
        {movingCalendarData.data.length > 0 && streamId && (
          <Calendar streamId={streamId} />
        )}
        {isMobile && <ThresholdsConfigurator />}
      </S.StationDataContainer>
    </S.CalendarPageLayout>
  );
};

export { CalendarPage };
