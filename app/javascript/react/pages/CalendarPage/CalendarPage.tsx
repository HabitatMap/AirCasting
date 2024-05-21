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
import { EmptyCalendar } from "../../components/molecules/Calendar/EmptyCalendar";

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

  const calendarIsVisible =
    movingCalendarData.data.length &&
    streamId &&
    fixedStreamData.stream.startTime &&
    fixedStreamData.stream.endTime;

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
    console.log(fixedStreamData.streamDailyAverages);
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
        {calendarIsVisible ? (
          <Calendar
            streamId={streamId}
            minCalendarDate={fixedStreamData.stream.startTime}
            maxCalendarDate={fixedStreamData.stream.endTime}
          />
        ) : <EmptyCalendar/> }
        {isMobile && <ThresholdsConfigurator />}
      </S.StationDataContainer>
    </S.CalendarPageLayout>
  );
};

export { CalendarPage };
