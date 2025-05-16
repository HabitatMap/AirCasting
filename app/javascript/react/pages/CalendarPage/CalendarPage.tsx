import moment from "moment-timezone";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Calendar } from "../../components/molecules/Calendar";
import { EmptyCalendar } from "../../components/molecules/Calendar/EmptyCalendar";
import HeaderToggle from "../../components/molecules/Calendar/HeaderToggle/HeaderToggle";
import { FixedStreamStationHeader } from "../../components/molecules/FixedStreamStationHeader";
import { Graph } from "../../components/organisms/Graph/Graph";
import MeasurementComponent from "../../components/organisms/Graph/MeasurementComponent";
import TimeRange from "../../components/organisms/Graph/TimeRage";
import { ResetButton } from "../../components/organisms/ThresholdConfigurator/ThresholdButtons/ResetButton";
import { ThresholdButtonVariant } from "../../components/organisms/ThresholdConfigurator/ThresholdButtons/ThresholdButton";
import { UniformDistributionButton } from "../../components/organisms/ThresholdConfigurator/ThresholdButtons/UniformDistributionButton";

import {
  selectFixedData,
  selectFixedStreamShortInfo,
  selectIsLoading,
} from "../../store/fixedStreamSelectors";
import { fetchFixedStreamById } from "../../store/fixedStreamSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNewMovingStream,
  movingData,
} from "../../store/movingCalendarStreamSlice";
import { setDefaultThresholdsValues } from "../../store/thresholdSlice";

import { SessionTypes } from "../../types/filters";

import { useCalendarBackNavigation } from "../../hooks/useBackNavigation";
import { useMapParams } from "../../utils/mapParamsHandler";
import { formatTime } from "../../utils/measurementsCalc";
import useMobileDetection from "../../utils/useScreenSizeDetection";

import { ThresholdsConfigurator } from "../../components/organisms/ThresholdConfigurator/ThresholdConfigurator";
import * as S from "./CalendarPage.style";

interface CalendarPageProps {
  children: React.ReactNode;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const { t } = useTranslation();
  const handleCalendarGoBack = useCalendarBackNavigation();
  const { unitSymbol, streamId } = useMapParams();

  const fixedStreamData = useAppSelector(selectFixedData);
  const movingCalendarData = useAppSelector(movingData);
  const { startTime, endTime } = useAppSelector(selectFixedStreamShortInfo);
  const isLoading = useAppSelector(selectIsLoading);

  const rangeDisplayRef = useRef(null);
  const { formattedMinTime, formattedMaxTime } = formatTime(startTime, endTime);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialDataFetched, setInitialDataFetched] = useState(false);

  // Maintain selectedTimestamp across fetches until explicitly cleared.
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(
    null
  );

  const calendarIsVisible =
    (movingCalendarData.data.length > 0 || isLoading) &&
    streamId &&
    fixedStreamData.stream.startTime;
  const streamEndTime: string =
    fixedStreamData.stream.endTime ??
    fixedStreamData.stream.lastUpdate ??
    moment().format("YYYY-MM-DD");

  useEffect(() => {
    if (streamId && !fixedStreamData.measurements.length) {
      dispatch(fetchFixedStreamById(streamId));
    }
  }, [streamId, dispatch, fixedStreamData.measurements.length]);

  useEffect(() => {
    if (fixedStreamData.stream) {
      dispatch(setDefaultThresholdsValues(fixedStreamData.stream));
    }
  }, [fixedStreamData.stream, dispatch]);

  useEffect(() => {
    if (
      !initialDataFetched &&
      streamId &&
      fixedStreamData.stream.startTime &&
      streamEndTime
    ) {
      dispatch(
        fetchNewMovingStream({
          id: streamId,
          startDate: fixedStreamData.stream.startTime,
          endDate: streamEndTime,
        })
      );
      setInitialDataFetched(true);
    }
  }, [
    initialDataFetched,
    streamId,
    fixedStreamData.stream.startTime,
    streamEndTime,
    dispatch,
  ]);

  useEffect(() => {
    window.addEventListener("popstate", handleCalendarGoBack);
    return () => window.removeEventListener("popstate", handleCalendarGoBack);
  }, [handleCalendarGoBack]);

  const handleDayClick = (timestamp: number | null) => {
    setSelectedTimestamp(timestamp);
  };

  const renderMobileGraph = () => (
    <S.GraphContainer $isMobile={isMobile}>
      <HeaderToggle
        data-testid="graph-header"
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
              data-testid="time-range"
              ref={rangeDisplayRef}
              minTime={formattedMinTime}
              maxTime={formattedMaxTime}
            />
            <Graph
              data-testid="graph"
              streamId={Number(streamId)}
              sessionType={SessionTypes.FIXED}
              isCalendarPage={true}
              rangeDisplayRef={rangeDisplayRef}
              selectedTimestamp={selectedTimestamp}
              onDayClick={handleDayClick}
            />
            <MeasurementComponent />
          </>
        }
      />
    </S.GraphContainer>
  );

  const renderThresholdContainer = () => (
    <S.ThresholdContainer $isMobile={isMobile}>
      <HeaderToggle
        data-testid="threshold-toggle"
        titleText={
          <S.StyledContainer>
            {t("calendarHeader.legendTitle")}
            <S.Units>({unitSymbol})</S.Units>
            {!isMobile && (
              <S.ThresholdButtonsContainer>
                <ResetButton
                  data-testid="reset-threshold"
                  variant={ThresholdButtonVariant.TextWithIcon}
                  swapIconTextPosition={true}
                />
                <UniformDistributionButton
                  variant={ThresholdButtonVariant.TextWithIcon}
                  swapIconTextPosition={true}
                  hasErrorMessage={setErrorMessage}
                />
              </S.ThresholdButtonsContainer>
            )}
          </S.StyledContainer>
        }
        componentToToggle={
          isMobile ? (
            <ThresholdsConfigurator
              data-testid="threshold-configurator"
              resetButtonVariant={ThresholdButtonVariant.TextWithIcon}
              resetButtonText={t("thresholdConfigurator.resetButton")}
              useColorBoxStyle
              uniformDistributionButtonText={t(
                "thresholdConfigurator.uniformDistributionButton"
              )}
              uniformDistributionButtonVariant={
                ThresholdButtonVariant.TextWithIcon
              }
            />
          ) : (
            <S.SliderWrapper>
              {errorMessage && <S.ErrorMessage>{errorMessage}</S.ErrorMessage>}
              <ThresholdsConfigurator
                data-testid="threshold-configurator"
                noDisclaimers={true}
              />
            </S.SliderWrapper>
          )
        }
      />
    </S.ThresholdContainer>
  );

  const renderDesktopGraph = () => (
    <S.GraphContainer $isMobile={isMobile}>
      <HeaderToggle
        titleText={
          <S.StyledContainerWithGraph>
            {t("calendarHeader.graphTitle")}
            <>
              <MeasurementComponent />
              <TimeRange
                ref={rangeDisplayRef}
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
            rangeDisplayRef={rangeDisplayRef}
            selectedTimestamp={selectedTimestamp}
            onDayClick={handleDayClick}
          />
        }
      />
    </S.GraphContainer>
  );

  return (
    <>
      {children}
      <S.CalendarPageLayout>
        <S.StationDataContainer>
          <FixedStreamStationHeader data-testid="fixed-stream-station-header" />
          {isMobile && renderMobileGraph()}
          {renderThresholdContainer()}
          {calendarIsVisible ? (
            <Calendar
              data-testid="calendar"
              streamId={streamId}
              minCalendarDate={fixedStreamData.stream.startTime}
              maxCalendarDate={streamEndTime}
              onDayClick={handleDayClick}
              selectedTimestamp={selectedTimestamp}
            />
          ) : (
            <EmptyCalendar />
          )}
          {!isMobile && renderDesktopGraph()}
        </S.StationDataContainer>
      </S.CalendarPageLayout>
    </>
  );
};

export { CalendarPage };
