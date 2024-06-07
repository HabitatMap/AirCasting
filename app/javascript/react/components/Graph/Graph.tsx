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

const Graph = (props: HighchartsReact.Props) => {
  const thresholdsState = useSelector(selectThreshold);
  const fixedStreamData = useSelector(selectFixedData);
  const measurements = fixedStreamData?.measurements || [];
  const unitSymbol = fixedStreamData?.stream.unitSymbol || "";
  const measurementType = "Particulate Matter"; // take this parameter from filters in the future

  const seriesData = measurements.map((measurement) => [
    measurement.time,
    measurement.value,
  ]);

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
      scrollablePlotArea: {
        minWidth: 1000,
        scrollPositionX: 1,
        minHeight: 200,
      },
      events: {
        load: handleLoad,
        redraw: handleRedraw,
      },
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
      <S.ScrollbarContainer id="scrollbar-container" />
      <S.ChartContainer>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={"chart"}
          options={options}
          {...props}
        />
      </S.ChartContainer>
    </S.Container>
  );
};

export { Graph };
