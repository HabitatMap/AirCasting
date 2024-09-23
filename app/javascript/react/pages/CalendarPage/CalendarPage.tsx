import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Graph } from "../../components/Graph";
import MeasurementComponent from "../../components/Graph/MeasurementComponent";
import TimeRange from "../../components/Graph/TimeRage";
import HeaderToggle from "../../components/molecules/Calendar/HeaderToggle/HeaderToggle";
import { FixedStreamStationHeader } from "../../components/molecules/FixedStreamStationHeader";
import { ThresholdsConfigurator } from "../../components/ThresholdConfigurator";
import { ResetButton } from "../../components/ThresholdConfigurator/ThresholdButtons/ResetButton";
import { ThresholdButtonVariant } from "../../components/ThresholdConfigurator/ThresholdButtons/ThresholdButton";
import { UniformDistributionButton } from "../../components/ThresholdConfigurator/ThresholdButtons/UniformDistributionButton";

import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  fetchFixedStreamById,
  selectFixedData,
  selectIsLoading,
} from "../../store/fixedStreamSlice";
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
    window.addEventListener("popstate", handleCalendarGoBack);
    return () => window.removeEventListener("popstate", handleCalendarGoBack);
  }, [handleCalendarGoBack]);

  useEffect(() => {
    if (
      streamId &&
      !isLoading &&
      fixedStreamData.stream.startTime &&
      streamEndTime
    ) {
      const startMoment = moment(fixedStreamData.stream.startTime);
      const endMoment = moment(streamEndTime);

      if (startMoment.isValid() && endMoment.isValid()) {
        const formattedEndDate = endMoment.format("YYYY-MM-DD");
        const newStartDate = endMoment
          .clone()
          .date(1)
          .subtract(2, "months")
          .format("YYYY-MM-DD");

        dispatch(
          fetchNewMovingStream({
            id: streamId,
            startDate: newStartDate,
            endDate: formattedEndDate,
          })
        );
      }
    }
    dispatch(setDefaultThresholdsValues(fixedStreamData.stream));
  }, [fixedStreamData, streamId, isLoading, streamEndTime]);

  const renderMobileGraph = () => (
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
              ref={rangeDisplayRef}
              minTime={formattedMinTime}
              maxTime={formattedMaxTime}
            />
            <Graph
              streamId={Number(streamId)}
              sessionType={SessionTypes.FIXED}
              isCalendarPage={true}
              rangeDisplayRef={rangeDisplayRef}
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
        titleText={
          <S.StyledContainer>
            {t("calendarHeader.legendTitle")}
            <S.Units>({unitSymbol})</S.Units>
            {!isMobile && (
              <S.ThresholdButtonsContainer>
                <ResetButton
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
              <ThresholdsConfigurator noDisclaimers={true} />
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
          <FixedStreamStationHeader />
          {/* {isMobile && renderMobileGraph()}
          {renderThresholdContainer()}
          {calendarIsVisible ? (
            <Calendar
              streamId={streamId}
              minCalendarDate={fixedStreamData.stream.startTime}
              maxCalendarDate={streamEndTime}
            />
          ) : (
            <EmptyCalendar />
          )}
          {!isMobile && renderDesktopGraph()} */}
        </S.StationDataContainer>
      </S.CalendarPageLayout>
    </>
  );
};

export { CalendarPage };
