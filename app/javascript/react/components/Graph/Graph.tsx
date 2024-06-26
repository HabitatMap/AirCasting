import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import {
  selectFixedData,
  selectIsLoading,
  updateFixedMeasurementExtremes,
} from "../../store/fixedStreamSlice";
import { useAppDispatch } from "../../store/hooks";
import { setHoverStreamId } from "../../store/mapSlice";
import {
  selectMobileStreamData,
  selectMobileStreamShortInfo,
} from "../../store/mobileStreamSelectors";
import { updateMobileMeasurementExtremes } from "../../store/mobileStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
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
  const thresholdsState = useSelector(selectThreshold);
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  const isLoading = useSelector(selectIsLoading);

  const graphData = fixedSessionTypeSelected
    ? useSelector(selectFixedData)
    : useSelector(selectMobileStreamData);

  const streamShortInfo: StreamShortInfo = useSelector(
    fixedSessionTypeSelected
      ? selectFixedStreamShortInfo
      : selectMobileStreamShortInfo
  );

  const unitSymbol = streamShortInfo?.unitSymbol || "";
  const measurementType = "Particulate Matter";

  const isMobile = useMobileDetection();
  const dispatch = useAppDispatch();

  const seriesData = (graphData?.measurements || [])
    .map((measurement) => [measurement.time, measurement.value])
    .sort((a, b) => a[0] - b[0]);

  const [selectedRange, setSelectedRange] = useState(
    fixedSessionTypeSelected ? 0 : 2
  );

  const xAxisOptions = getXAxisOptions(fixedSessionTypeSelected, isMobile);
  const yAxisOption = getYAxisOptions(thresholdsState, isMobile);
  const tooltipOptions = getTooltipOptions(measurementType, unitSymbol);

  const totalDuration =
    seriesData.length > 0
      ? seriesData[seriesData.length - 1][0] - seriesData[0][0]
      : 0;

  const rangeSelectorOptions = getRangeSelectorOptions(
    fixedSessionTypeSelected,
    totalDuration,
    selectedRange
  );

  const plotOptions = getPlotOptions();

  const responsive = getResponsiveOptions(thresholdsState);

  useEffect(() => {
    if (seriesData.length > 0 && !isLoading) {
      if (fixedSessionTypeSelected) {
        const newestMeasurement = seriesData[seriesData.length - 1];
        const minTime = newestMeasurement[0] - MILLISECONDS_IN_A_DAY;
        const maxTime = newestMeasurement[0];
        if (minTime && maxTime) {
          dispatch(
            updateFixedMeasurementExtremes({ min: minTime, max: maxTime })
          );
        }
      } else {
        const minTime = Math.min(...seriesData.map((m) => m[0]));
        const maxTime = Math.max(...seriesData.map((m) => m[0]));
        dispatch(
          updateMobileMeasurementExtremes({ min: minTime, max: maxTime })
        );
      }
    }
  }, [seriesData, isLoading, dispatch, fixedSessionTypeSelected]);

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
    plotOptions: {
      ...plotOptions,
      series: {
        ...plotOptions.series,
        point: {
          events: {
            mouseOver: function () {
              dispatch(setHoverStreamId(streamId)); // Dispatch setHoverStreamId with the hovered point's streamId
            },
            mouseOut: function () {
              dispatch(setHoverStreamId(null)); // Clear the hover stream ID when mouse out
            },
          },
        },
      },
    },
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
      margin: [40, 30, 0, 10],
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
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={"stockChart"}
        options={options}
      />
    </S.Container>
  );
};

export { Graph };
