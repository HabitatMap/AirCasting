import React, { useEffect } from "react";
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
  rangeSelectorOptions,
} from "./graphConfig";
import { useSelector } from "react-redux";
import {
  selectFixedData,
  selectIsLoading,
  updateMeasurementExtremes,
} from "../../store/fixedStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import { selectMobileStreamData } from "../../store/mobileStreamSelectors";
import { selectMobileStreamShortInfo } from "../../store/mobileStreamSelectors";
import { useAppDispatch } from "../../store/hooks";

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
}

const Graph: React.FC<GraphProps> = ({ streamId, sessionType }) => {
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

  const xAxisOptions = getXAxisOptions();

  const yAxisOption = getYAxisOptions(thresholdsState);
  const tooltipOptions = getTooltipOptions(measurementType, unitSymbol);
  // ...

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (measurements.length > 0 && !isLoading) {
      const now = Date.now();
      const last24Hours = measurements.filter(
        (m) => now - m.time <= 24 * 60 * 60 * 1000
      );
      if (last24Hours.length > 0) {
        const minTime = Math.min(...last24Hours.map((m) => m.time));
        const maxTime = Math.max(...last24Hours.map((m) => m.time));
        dispatch(updateMeasurementExtremes({ min: minTime, max: maxTime }));
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
      height: 250,
      margin: [50, 50, 0, 0],
      scrollablePlotArea: {
        minWidth: 100,
        scrollPositionX: 1,
      },
    },
    responsive,
    tooltip: tooltipOptions,
    scrollbar: scrollbarOptions,
    navigator: {
      enabled: false,
    },
    rangeSelector: rangeSelectorOptions,
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
