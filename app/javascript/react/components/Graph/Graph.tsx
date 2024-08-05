import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import { selectFixedData, selectIsLoading } from "../../store/fixedStreamSlice";
import {
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
} from "../../store/mobileStreamSelectors";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { LatLngLiteral } from "../../types/googleMaps";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
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
  rangeDisplayRef: React.RefObject<HTMLDivElement>;
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

  const thresholdsState = useSelector(selectThresholds);
  const isLoading = useSelector(selectIsLoading);
  const fixedGraphData = useSelector(selectFixedData);
  const mobileGraphData = useSelector(selectMobileStreamPoints);
  const streamShortInfo: StreamShortInfo = useSelector(
    fixedSessionTypeSelected
      ? selectFixedStreamShortInfo
      : selectMobileStreamShortInfo
  );

  const unitSymbol = streamShortInfo?.unitSymbol ?? "";
  const measurementType = "Particulate Matter";

  const isMobile = useMobileDetection();

  const fixedSeriesData = (fixedGraphData?.measurements || [])
    .map((measurement: { time: any; value: any }) => [
      measurement.time,
      measurement.value,
    ])
    .sort((a, b) => a[0] - b[0]);

  const mobileSeriesData = mobileGraphData
    .map((measurement) => ({
      x: measurement.time,
      y: measurement.lastMeasurementValue,
      position: {
        lat: measurement.point.lat,
        lng: measurement.point.lng,
      } as LatLngLiteral,
    }))
    .filter((point) => point.x !== undefined)
    .sort((a, b) => (a.x as number) - (b.x as number));

  const seriesData = fixedSessionTypeSelected
    ? fixedSeriesData
    : mobileSeriesData;

  const totalDuration =
    seriesData.length > 0
      ? (seriesData[seriesData.length - 1] as any)[0] -
        (seriesData[0] as any)[0]
      : 0;

  const xAxisOptions = getXAxisOptions(
    fixedSessionTypeSelected,
    isMobile,
    rangeDisplayRef
  );
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
    if (!chartDataLoaded && seriesData.length > 0 && !isLoading) {
      setChartDataLoaded(true);
    }
  }, [chartDataLoaded, seriesData, isLoading]);

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
            click: () => setSelectedRange(i),
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
