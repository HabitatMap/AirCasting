import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectFixedData, selectIsLoading } from "../../store/fixedStreamSlice";
import { selectMeasurementsData } from "../../store/measurementsSelectors";
import { selectMobileStreamPoints } from "../../store/mobileStreamSelectors";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import {
  createFixedSeriesData,
  createMobileSeriesData,
} from "../../utils/createGraphData";
import { useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { handleLoad } from "./chartEvents";
import * as S from "./Graph.style";
import {
  getChartOptions,
  getPlotOptions,
  getRangeSelectorOptions,
  getResponsiveOptions,
  getScrollbarOptions,
  getTooltipOptions,
  getXAxisOptions,
  getYAxisOptions,
  legendOption,
  seriesOptions,
} from "./graphConfig";

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
  isCalendarPage: boolean;
  rangeDisplayRef?: React.RefObject<HTMLDivElement> | undefined;
}

const Graph: React.FC<GraphProps> = ({
  streamId,
  sessionType,
  isCalendarPage,
  rangeDisplayRef,
}) => {
  const graphRef = useRef<HTMLDivElement>(null);

  const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;
  const [selectedRange, setSelectedRange] = useState(
    fixedSessionTypeSelected ? 0 : 2
  );
  const [chartDataLoaded, setChartDataLoaded] = useState(false);
  const [extremesChanged, setExtremesChanged] = useState(false);

  const thresholdsState = useSelector(selectThresholds);
  const isLoading = useSelector(selectIsLoading);
  const fixedGraphData = useSelector(selectFixedData);
  const measurementsData = useSelector(selectMeasurementsData);
  const mobileGraphData = useSelector(selectMobileStreamPoints);

  const { unitSymbol, measurementType } = useMapParams();

  const isMobile = useMobileDetection();

  const fixedSeriesData = createFixedSeriesData(fixedGraphData?.measurements);
  const fixedMeasurementsSeriesData = createFixedSeriesData(measurementsData);
  const mobileSeriesData = createMobileSeriesData(mobileGraphData, true);
  const mobileMeasurementsSeriesData = createMobileSeriesData(
    measurementsData,
    false
  );

  const isInitialRender = useRef(true);

  const seriesData = useMemo(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return fixedSessionTypeSelected
        ? fixedMeasurementsSeriesData
        : mobileMeasurementsSeriesData;
    }
    return fixedSessionTypeSelected ? fixedSeriesData : mobileSeriesData;
  }, [
    fixedSessionTypeSelected,
    fixedMeasurementsSeriesData,
    mobileMeasurementsSeriesData,
    fixedSeriesData,
    mobileSeriesData,
  ]);

  const totalDuration = useMemo(() => {
    if (seriesData.length === 0) return 0;
    const [first, last] = [seriesData[0], seriesData[seriesData.length - 1]];
    return fixedSessionTypeSelected
      ? (last as number[])[0] - (first as number[])[0]
      : (last as { x: number }).x - (first as { x: number }).x;
  }, [seriesData, fixedSessionTypeSelected]);

  const xAxisOptions = getXAxisOptions(isMobile, rangeDisplayRef, streamId);
  const yAxisOption = getYAxisOptions(thresholdsState, isMobile);
  const tooltipOptions = getTooltipOptions(measurementType, unitSymbol);
  const rangeSelectorOptions = getRangeSelectorOptions(
    fixedSessionTypeSelected,
    totalDuration,
    selectedRange,
    isCalendarPage
  );
  const plotOptions = getPlotOptions(fixedSessionTypeSelected, streamId);
  const responsive = getResponsiveOptions(thresholdsState);
  const scrollbarOptions = getScrollbarOptions(isCalendarPage);
  const chartOptions = getChartOptions(isCalendarPage);

  useEffect(() => {
    if (seriesData.length > 0 && !isLoading) {
      setChartDataLoaded(true);
    }
  }, [seriesData, isLoading]);

  useEffect(() => {
    setExtremesChanged(false);
  }, []);

  useEffect(() => {
    const graphElement = graphRef.current;

    if (graphElement) {
      graphElement.style.touchAction = "pan-x";
      const highchartsContainer = graphElement.querySelector(
        ".highcharts-container"
      ) as HTMLDivElement | null;
      if (highchartsContainer) {
        highchartsContainer.style.overflow = "visible";
      }
      const highchartsChartContainer = graphElement.querySelector(
        "[data-highcharts-chart]"
      ) as HTMLDivElement | null;
      if (highchartsChartContainer) {
        highchartsChartContainer.style.overflow = "visible";
      }
    }
  }, [chartDataLoaded]);

  const options: Highcharts.Options = {
    title: undefined,
    xAxis: xAxisOptions,
    yAxis: yAxisOption,
    loading: { hideDuration: 1000, showDuration: 1000 },
    plotOptions: plotOptions,
    series: [seriesOptions(seriesData)],
    legend: legendOption,
    chart: {
      ...chartOptions,
      events: {
        load: function () {
          handleLoad.call(this, isCalendarPage, isMobile);
        },
      },
    },
    responsive,
    tooltip: tooltipOptions,
    scrollbar: scrollbarOptions,
    navigator: { enabled: false },
    rangeSelector: {
      ...rangeSelectorOptions,
      buttons:
        rangeSelectorOptions.buttons?.map((button, i) => ({
          ...button,
          events: {
            click: () => {
              setSelectedRange(i);
              setExtremesChanged(true);
            },
          },
        })) ?? [],
    },
  };

  return (
    <S.Container
      ref={graphRef}
      $isCalendarPage={isCalendarPage}
      $isMobile={isMobile}
    >
      {chartDataLoaded && (
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={"stockChart"}
          options={options}
        />
      )}
    </S.Container>
  );
};

export { Graph };
