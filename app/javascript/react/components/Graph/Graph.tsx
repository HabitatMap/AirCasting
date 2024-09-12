import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import {
  fetchMeasurements,
  selectFixedData,
  selectIsLoading,
} from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
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
  const [isMaxRangeFetched, setIsMaxRangeFetched] = useState(false);

  const thresholdsState = useSelector(selectThresholds);
  const isLoading = useSelector(selectIsLoading);
  const fixedGraphData = useSelector(selectFixedData);
  const mobileGraphData = useSelector(selectMobileStreamPoints);

  const { unitSymbol, measurementType } = useMapParams();

  const isMobile = useMobileDetection();

  const dispatch = useAppDispatch();

  const fixedSeriesData = createFixedSeriesData(fixedGraphData?.measurements);
  const mobileSeriesData = createMobileSeriesData(mobileGraphData, true);

  const seriesData = fixedSessionTypeSelected
    ? fixedSeriesData
    : mobileSeriesData;

  const getTimeRangeFromSelectedRange = (range: number) => {
    const now = new Date();
    let startTime = new Date();
    switch (range) {
      case 0: // Last 24 hours
        startTime.setHours(now.getHours() - 24);
        break;
      case 1: // Last 7 days
        startTime.setDate(now.getDate() - 7);
        break;
      case 2: // Last 30 days
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime = new Date(0); // All data
    }
    const endTime = now;
    return {
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
    };
  };

  const totalDuration = useMemo(() => {
    const data = seriesData;
    if (data.length === 0) return 0;
    const [first, last] = [data[0], data[data.length - 1]];
    return fixedSessionTypeSelected
      ? (last as number[])[0] - (first as number[])[0]
      : (last as { x: number }).x - (first as { x: number }).x;
  }, [seriesData, fixedSessionTypeSelected]);

  console.log("totalDuration", totalDuration);

  const fetchDataForRange = useCallback(
    (range: number) => {
      if (streamId && !isMaxRangeFetched) {
        if (range === 2) {
          // If range 2 is clicked, set isMaxRangeFetched to true immediately
          setIsMaxRangeFetched(true);
        }

        const { startTime, endTime } = getTimeRangeFromSelectedRange(range);
        const requiredDuration = endTime - startTime;

        if (totalDuration < requiredDuration) {
          const newStartTime = Math.min(startTime, Date.now() - totalDuration);
          console.log(
            "Fetching measurements for new range",
            newStartTime,
            endTime
          );
          dispatch(
            fetchMeasurements({
              streamId,
              startTime: newStartTime.toString(),
              endTime: endTime.toString(),
            })
          );
        } else {
          console.log(
            "No need to fetch, current data covers the selected range."
          );
        }
      } else if (isMaxRangeFetched) {
        console.log("Max range already fetched, no further fetches needed.");
      }
    },
    [streamId, isMaxRangeFetched, totalDuration, dispatch]
  );

  useEffect(() => {
    setIsMaxRangeFetched(false);
  }, [streamId]);

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
              console.log("clicked", i);
              setSelectedRange(i);
              fetchDataForRange(i);
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
