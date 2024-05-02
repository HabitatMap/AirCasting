import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ThresholdsConfigurator } from "../../components/ThresholdConfigurator";
import { FixedStreamStationHeader } from "../../components/molecules/FixedStreamStationHeader";
import { Calendar } from "../../components/molecules/Calendar";
import { useAppDispatch } from "../../store/hooks";
import {
  fetchFixedStreamById,
  selectFixedData,
} from "../../store/fixedStreamSlice";
import { updateMovingStreamData } from "../../store/movingCalendarStreamSlice";
import * as S from "./CalendarPage.style";
import { screenSizes } from "../../utils/media";

const STREAM_ID_QUERY_PARAMETER_NAME = "streamId";

const CalendarPage = () => {
  const [searchParams] = useSearchParams();
  const streamIdQuery = searchParams.get(STREAM_ID_QUERY_PARAMETER_NAME);
  const streamId = streamIdQuery && Number(streamIdQuery);

  const initialThresholds = useSelector(selectThreshold);
  const fixedStreamData = useSelector(selectFixedData);

  const dispatch = useAppDispatch();

  useEffect(() => {
    streamId && dispatch(fetchFixedStreamById(streamId));
  }, []);

<<<<<<< HEAD
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < screenSizes.mobile
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < screenSizes.mobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
=======
  useEffect(() => {
    console.log(
      "Fixed Stream Data Updated:",
      fixedStreamData.streamDailyAverages
    );
    if (fixedStreamData && fixedStreamData.streamDailyAverages.length > 0) {
      const movingData = fixedStreamData.streamDailyAverages.map(
        ({ date, value }) => ({
          date,
          value,
        })
      );
      console.log("Updating Moving Stream Data:", movingData);
      dispatch(updateMovingStreamData(movingData));
    } else {
      console.log("No daily averages to process.");
    }
  }, [fixedStreamData, dispatch]);
>>>>>>> ebe00fb6 (Working early version of calendar swipe.)

  return (
    <S.CalendarPageLayout>
      <S.StationDataContainer>
        <FixedStreamStationHeader />
        {!isMobile && <ThresholdsConfigurator />}
        <Calendar />
        {isMobile && <ThresholdsConfigurator />}
      </S.StationDataContainer>
    </S.CalendarPageLayout>
  );
};

export { CalendarPage };
