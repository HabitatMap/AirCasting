import React from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

import * as S from "./Graph.style";
import {
  xAxisOption,
  plotOptions,
  legendOption,
  seriesOptions,
  getYAxisOptions,
  responsive,
  getTooltipOptions,
  scrollbarOptions,
} from "./graphConfig";
import { useSelector } from "react-redux";
import { selectFixedData } from "../../store/fixedStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";
import { handleLoad, handleRedraw } from "./chartEvents";
import { SessionType, SessionTypes } from "../../types/filters";
import { MobileGraphData as GraphData } from "../../types/mobileStream";
import { MobileStreamShortInfo as StreamShortInfo } from "../../types/mobileStream";
import { selectFixedStreamShortInfo } from "../../store/fixedStreamSelectors";
import { selectMobileStreamData } from "../../store/mobileStreamSelectors";
import { selectMobileStreamShortInfo } from "../../store/mobileStreamSelectors";

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
}

const Graph: React.FC<GraphProps> = ({ streamId, sessionType }) => {
  const thresholdsState = useSelector(selectThreshold);
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

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

  const yAxisOption = getYAxisOptions(thresholdsState);
  const tooltipOptions = getTooltipOptions(measurementType, unitSymbol);

  const options: Highcharts.Options = {
    title: undefined,
    xAxis: xAxisOption,
    yAxis: yAxisOption,
    plotOptions,
    series: [seriesOptions(seriesData)],
    legend: legendOption,
    chart: {
      height: 250,
      borderRadius: 10,
      scrollablePlotArea: {
        minWidth: 250,
        scrollPositionX: 1,
        minHeight: 200,
      },

      // events: {
      //   load: handleLoad,
      //   redraw: handleRedraw,
      // },
    },
    responsive,
    tooltip: tooltipOptions,
    scrollbar: scrollbarOptions,
    navigator: {
      enabled: false,
    },
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
