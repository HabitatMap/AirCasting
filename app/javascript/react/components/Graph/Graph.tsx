import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  selectFixedData,
  selectIsLoading,
  updateFixedMeasurementExtremes,
} from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
import {
  selectMobileStreamPoints,
  selectMobileStreamShortInfo,
} from "../../store/mobileStreamSelectors";
import { updateMobileMeasurementExtremes } from "../../store/mobileStreamSlice";
import { selectThresholds } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { LatLngLiteral } from "../../types/googleMaps";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import { MILLISECONDS_IN_A_DAY } from "../../utils/timeRanges";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { handleLoad } from "./chartEvents";
import * as S from "./Graph.style";
import {
  getPlotOptions,
  getRangeSelectorOptions,
  getResponsiveOptions,
  getTooltipOptions,
  getXAxisOptions,
  getYAxisOptions,
  legendOption,
  scrollbarOptions,
  seriesOptions,
} from "./graphConfig";

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
}

const Graph: React.FC<GraphProps> = ({ streamId, sessionType }) => {
  const graphRef = useRef<HTMLDivElement>(null);

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const [selectedRange, setSelectedRange] = useState(
    fixedSessionTypeSelected ? 0 : 2
  );
  const [chartDataLoaded, setChartDataLoaded] = useState(false);
  const [initialExtremesUpdated, setInitialExtremesUpdated] = useState(false);

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
  const dispatch = useAppDispatch();

  const fixedSeriesData = useMemo(
    () =>
      (fixedGraphData?.measurements || [])
        .map((measurement: { time: any; value: any }) => [
          measurement.time,
          measurement.value,
        ])
        .sort((a, b) => a[0] - b[0]),
    [fixedGraphData]
  );

  const mobileSeriesData = useMemo(
    () =>
      mobileGraphData
        .map((measurement) => ({
          x: measurement.time,
          y: measurement.lastMeasurementValue,
          position: {
            lat: measurement.point.lat,
            lng: measurement.point.lng,
          } as LatLngLiteral,
        }))
        .filter((point) => point.x !== undefined)
        .sort((a, b) => (a.x as number) - (b.x as number)),
    [mobileGraphData]
  );

  const seriesData = fixedSessionTypeSelected
    ? fixedSeriesData
    : mobileSeriesData;

  const xAxisOptions = getXAxisOptions(
    fixedSessionTypeSelected,
    isMobile,
    (min, max) => {
      if (!initialExtremesUpdated) {
        dispatch(
          fixedSessionTypeSelected
            ? updateFixedMeasurementExtremes({ min, max })
            : updateMobileMeasurementExtremes({ min, max })
        );
        setInitialExtremesUpdated(true);
      }
    }
  );
  const yAxisOption = getYAxisOptions(thresholdsState, isMobile);
  const tooltipOptions = getTooltipOptions(measurementType, unitSymbol);

  const totalDuration = useMemo(
    () =>
      seriesData.length > 0
        ? (seriesData[seriesData.length - 1] as any)[0] -
          (seriesData[0] as any)[0]
        : 0,
    [seriesData]
  );

  const rangeSelectorOptions = getRangeSelectorOptions(
    fixedSessionTypeSelected,
    totalDuration,
    selectedRange
  );
  const plotOptions = getPlotOptions(fixedSessionTypeSelected, streamId);

  const responsive = getResponsiveOptions(thresholdsState);

  useEffect(() => {
    if (seriesData.length > 0 && !isLoading && !initialExtremesUpdated) {
      if (fixedSessionTypeSelected) {
        const newestMeasurement = fixedSeriesData[fixedSeriesData.length - 1];
        const minTime = newestMeasurement[0] - MILLISECONDS_IN_A_DAY;
        const maxTime = newestMeasurement[0];
        if (minTime && maxTime) {
          dispatch(
            updateFixedMeasurementExtremes({ min: minTime, max: maxTime })
          );
          setChartDataLoaded(true);
          setInitialExtremesUpdated(true);
        }
      } else {
        const minTime = Math.min(...mobileSeriesData.map((m) => m.x as number));
        const maxTime = Math.max(...mobileSeriesData.map((m) => m.x as number));
        if (minTime && maxTime) {
          dispatch(
            updateMobileMeasurementExtremes({ min: minTime, max: maxTime })
          );
          setChartDataLoaded(true);
          setInitialExtremesUpdated(true);
        }
      }
    }
  }, [initialExtremesUpdated]);

  useEffect(() => {
    const graphElement = graphRef.current;

    if (graphElement) {
      graphElement.style.touchAction = "pan-x";
    }
  }, []);

  const options: Highcharts.Options = {
    title: undefined,
    xAxis: xAxisOptions,
    yAxis: yAxisOption,
    loading: {
      hideDuration: 1000,
      showDuration: 1000,
    },
    plotOptions: plotOptions,
    series: [seriesOptions(seriesData)],
    legend: legendOption,
    chart: {
      zooming: {
        type: "x",
        resetButton: {
          theme: {
            style: { display: "none" },
          },
        },
      },
      height: 300,
      margin: [0, 60, 0, 0],
      animation: false,
      scrollablePlotArea: {
        minWidth: 100,
        scrollPositionX: 1,
      },
      events: !isMobile
        ? {
            load: function () {
              handleLoad.call(this);
            },
          }
        : undefined,
    },
    responsive,
    tooltip: tooltipOptions,
    scrollbar: scrollbarOptions,
    navigator: {
      enabled: false,
    },
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
    <S.Container ref={graphRef}>
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
