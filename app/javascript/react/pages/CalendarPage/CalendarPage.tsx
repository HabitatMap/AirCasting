import moment from "moment";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import { Calendar } from "../../components/molecules/Calendar";
import { EmptyCalendar } from "../../components/molecules/Calendar/EmptyCalendar";
import { FixedStreamStationHeader } from "../../components/molecules/FixedStreamStationHeader";
import { ThresholdsConfigurator } from "../../components/ThresholdConfigurator";
import {
  fetchFixedStreamById,
  selectFixedData,
} from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
import {
  fetchNewMovingStream,
  movingData,
} from "../../store/movingCalendarStreamSlice";
import {
  selectUserAdjustedValues,
  updateAll,
} from "../../store/thresholdSlice";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import * as S from "./CalendarPage.style";

const STREAM_ID_QUERY_PARAMETER_NAME = "streamId";

interface CalendarPageProps {
  children: React.ReactNode;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const [searchParams] = useSearchParams();

  const streamIdQuery = searchParams.get(STREAM_ID_QUERY_PARAMETER_NAME);
  const streamId = streamIdQuery && Number(streamIdQuery);

  const fixedStreamData = useSelector(selectFixedData);
  const movingCalendarData = useSelector(movingData);
  const userAdjustedThresholdValues = useSelector(selectUserAdjustedValues);

  const calendarIsVisible =
    movingCalendarData.data.length &&
    streamId &&
    fixedStreamData.stream.startTime;

  const streamEndTime: string =
    fixedStreamData.stream.endTime ??
    fixedStreamData.stream.lastUpdate ??
    moment().format("YYYY-MM-DD");

  useEffect(() => {
    streamId && dispatch(fetchFixedStreamById(streamId));
  }, []);

  useEffect(() => {
    const formattedEndMoment = moment(streamEndTime, "YYYY-MM-DD");
    const formattedEndDate = formattedEndMoment.format("YYYY-MM-DD");
    const newStartDate = formattedEndMoment
      .date(1)
      .subtract(2, "months")
      .format("YYYY-MM-DD");

    console.log(
      "Downloading first time - moving stream data. Start - End: ",
      newStartDate,
      formattedEndDate
    );
    if (streamId) {
      dispatch(
        fetchNewMovingStream({
          id: streamId,
          startDate: newStartDate,
          endDate: formattedEndDate,
        })
      );
    }
    !userAdjustedThresholdValues && dispatch(updateAll(fixedStreamData.stream));
  }, [fixedStreamData, dispatch]);

  return (
    <>
      {children}
      <S.CalendarPageLayout>
        <S.StationDataContainer>
          <FixedStreamStationHeader />
          {!isMobile && <ThresholdsConfigurator isMapPage={false} />}
          {calendarIsVisible ? (
            <Calendar
              streamId={streamId}
              minCalendarDate={fixedStreamData.stream.startTime}
              maxCalendarDate={streamEndTime}
            />
          ) : (
            <EmptyCalendar />
          )}
          {isMobile && <ThresholdsConfigurator isMapPage={false} />}
        </S.StationDataContainer>
      </S.CalendarPageLayout>
    </>
  );
};

export { CalendarPage };
