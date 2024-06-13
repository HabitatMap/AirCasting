import React, { useState, useEffect } from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

import * as S from "./Graph.style";
import {
  getXAxisOptions,
  plotOptions,
  legendOption,
  seriesOptions,
  getYAxisOptions,
  responsive,
  getTooltipOptions,
  scrollbarOptions,
  credits,
  getRangeSelectorOptions,
} from "./graphConfig";
import { useSelector } from "react-redux";
import {
  selectFixedData,
  selectIsLoading,
  updateFixedMeasurementExtremes,
} from "../../store/fixedStreamSlice";
import { updateMobileMeasurementExtremes } from "../../store/mobileStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import { selectMobileStreamData } from "../../store/mobileStreamSelectors";
import { selectMobileStreamShortInfo } from "../../store/mobileStreamSelectors";
import { useAppDispatch } from "../../store/hooks";
import { handleLoad, handleRedraw } from "./chartEvents";

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
}

const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

const Graph: React.FC<GraphProps> = ({ streamId, sessionType }) => {
  const [tooltipVisible, setTooltipVisible] = useState(true);

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

  const measurements = graphData?.measurements || [];
  const unitSymbol = streamShortInfo?.unitSymbol || "";
  const measurementType = "Particulate Matter"; // take this parameter from filters in the future

  const seriesData = measurements.map(
    (measurement: { time: number; value: number }) => [
      measurement.time,
      measurement.value,
    ]
  );

  const xAxisOptions = getXAxisOptions(fixedSessionTypeSelected);
  const yAxisOption = getYAxisOptions(thresholdsState);
  const tooltipOptions = getTooltipOptions(
    measurementType,
    unitSymbol,
    tooltipVisible
  );
  const rangeSelectorOptions = getRangeSelectorOptions(
    fixedSessionTypeSelected
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (measurements.length > 0 && !isLoading) {
      const now = Date.now();
      const last24Hours = measurements.filter(
        (m) => now - m.time <= MILLISECONDS_IN_A_DAY
      );
      if (last24Hours.length > 0) {
        const minTime = Math.min(...last24Hours.map((m) => m.time));
        const maxTime = Math.max(...last24Hours.map((m) => m.time));
        dispatch(
          fixedSessionTypeSelected
            ? updateFixedMeasurementExtremes({ min: minTime, max: maxTime })
            : updateMobileMeasurementExtremes({ min: minTime, max: maxTime })
        );
      }
    }
  }, [measurements]);

  const options: Highcharts.Options = {
    title: undefined,
    xAxis: xAxisOptions,
    yAxis: yAxisOption,
    plotOptions,
    series: [seriesOptions(seriesData)],
    legend: legendOption,
    chart: {
      zooming: { type: "x" },
      height: 300,
      margin: [40, 30, 0, 0],
      scrollablePlotArea: {
        minWidth: 100,
        scrollPositionX: 1,
      },
      events: {
        load: function () {
          handleLoad.call(this, setTooltipVisible);
        },
        redraw: function () {
          handleRedraw.call(this, setTooltipVisible);
        },
      },
    },
    responsive,
    tooltip: tooltipOptions,
    scrollbar: scrollbarOptions,
    navigator: {
      enabled: false,
    },
    rangeSelector: rangeSelectorOptions,
    credits: credits,
  };

  return (
    <S.Container>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={"stockChart"}
        options={options}
      />
    </S.Container>
  );
};

export { Graph };
