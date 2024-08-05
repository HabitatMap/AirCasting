import moment from "moment";
import React, { useEffect } from "react";

import { useTranslation } from "react-i18next";
import { Graph } from "../../components/Graph";

import MeasurementComponent from "../../components/Graph/MeasurementComponent";
import { Calendar } from "../../components/molecules/Calendar";
import { EmptyCalendar } from "../../components/molecules/Calendar/EmptyCalendar";
import HeaderToggle from "../../components/molecules/Calendar/HeaderToggle/HeaderToggle";
import { FixedStreamStationHeader } from "../../components/molecules/FixedStreamStationHeader";
import { ThresholdsConfigurator } from "../../components/ThresholdConfigurator";
import {
  ResetButton,
  ResetButtonVariant,
} from "../../components/ThresholdConfigurator/ResetButton";
// import { selectMinAndMaxTime } from "../../store/fixedStreamSelectors";
import TimeRange from "../../components/Graph/TimeRage";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  fetchFixedStreamById,
  selectFixedData,
} from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNewMovingStream,
  movingData,
} from "../../store/movingCalendarStreamSlice";
import { setDefaultThresholdsValues } from "../../store/thresholdSlice";
import { SessionTypes } from "../../types/filters";
import { useMapParams } from "../../utils/mapParamsHandler";
import { formatTime } from "../../utils/measurementsCalc";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import * as S from "./CalendarPage.style";

interface CalendarPageProps {
  children: React.ReactNode;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const { t } = useTranslation();

  const { streamId } = useMapParams();

  const fixedStreamData = useAppSelector(selectFixedData);
  const movingCalendarData = useAppSelector(movingData);
  const { startTime, endTime } = useAppSelector(selectFixedStreamShortInfo);

  const { formattedMinTime, formattedMaxTime } = formatTime(startTime, endTime);

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
    dispatch(setDefaultThresholdsValues(fixedStreamData.stream));
  }, [fixedStreamData, dispatch]);

  return (
    <>
      {children}
      <S.CalendarPageLayout>
        <S.StationDataContainer>
          <FixedStreamStationHeader />
          {isMobile && (
            <S.GraphContainer $isMobile={isMobile}>
              <HeaderToggle
                isCalendarPage={true}
                titleText={
                  <S.StyledContainer>
                    {t("calendarHeader.graphTitle")}
                  </S.StyledContainer>
                }
                componentToToggle={
                  <>
                    <S.SelectLabelContainer>
                      {t("calendarHeader.selectRange")}
                    </S.SelectLabelContainer>
                    <TimeRange
                      minTime={formattedMinTime}
                      maxTime={formattedMaxTime}
                    />
                    <Graph
                      streamId={Number(streamId)}
                      sessionType={SessionTypes.FIXED}
                      isCalendarPage={true}
                    />

                    <MeasurementComponent />
                  </>
                }
              />
            </S.GraphContainer>
          )}
          {!isMobile && (
            <S.ThresholdContainer $isMobile={isMobile}>
              <HeaderToggle
                titleText={
                  <S.StyledContainer>
                    {t("calendarHeader.legendTitle")}
                    <S.Units>{t("calendarHeader.measurementsUnits")}</S.Units>
                    <ResetButton
                      variant={ResetButtonVariant.TextWithIcon}
                      swapIconTextPosition={true}
                    ></ResetButton>
                  </S.StyledContainer>
                }
                componentToToggle={
                  <S.SliderWrapper>
                    <ThresholdsConfigurator noDisclaimers={true} />
                  </S.SliderWrapper>
                }
              />
            </S.ThresholdContainer>
          )}
          {isMobile && (
            <S.ThresholdContainer $isMobile={isMobile}>
              <HeaderToggle
                titleText={
                  <S.StyledContainer>
                    {t("calendarHeader.legendTitle")}
                    <S.Units>{t("calendarHeader.measurementsUnits")}</S.Units>
                  </S.StyledContainer>
                }
                componentToToggle={
                  <ThresholdsConfigurator
                    resetButtonVariant={ResetButtonVariant.TextWithIcon}
                    resetButtonText={t("thresholdConfigurator.resetButton")}
                    useColorBoxStyle
                  />
                }
              />
            </S.ThresholdContainer>
          )}
          {calendarIsVisible ? (
            <Calendar
              streamId={streamId}
              minCalendarDate={fixedStreamData.stream.startTime}
              maxCalendarDate={streamEndTime}
            />
          ) : (
            <EmptyCalendar />
          )}
          {!isMobile && (
            <S.GraphContainer $isMobile={isMobile}>
              <HeaderToggle
                titleText={
                  <S.StyledContainerWithGraph>
                    {t("calendarHeader.graphTitle")}

                    <>
                      <MeasurementComponent />
                      <TimeRange
                        minTime={formattedMinTime}
                        maxTime={formattedMaxTime}
                      />
                    </>
                  </S.StyledContainerWithGraph>
                }
                componentToToggle={
                  <Graph
                    streamId={streamId}
                    sessionType={SessionTypes.FIXED}
                    isCalendarPage={true}
                  />
                }
              />
            </S.GraphContainer>
          )}
        </S.StationDataContainer>
      </S.CalendarPageLayout>
    </>
  );
};

export { CalendarPage };
