import React, { useEffect, useState } from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

import * as S from "./Graph.style";
import {
  xAxisOption,
  plotOptions,
  titleOption,
  legendOption,
  seriesOption,
  getYAxisOption,
  responsive,
} from "./graphConfig";
import { useSelector } from "react-redux";
import { selectFixedData } from "../../store/fixedStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";

const Graph = (props: HighchartsReact.Props) => {
  const thresholdsState = useSelector(selectThreshold);
  const fixedStreamData = useSelector(selectFixedData);
  const measurements = fixedStreamData?.measurements || [];

  const seriesData = measurements.map((measurement) => [
    measurement.time,
    measurement.value,
  ]);

  const yAxisOption = getYAxisOption(thresholdsState);

  const options: Highcharts.Options = {
    title: undefined,
    xAxis: xAxisOption,
    yAxis: yAxisOption,
    plotOptions,
    series: [seriesOption(seriesData)],
    legend: legendOption,
    chart: {
      height: 250,
      borderRadius: 10,
    },
  };
  return (
    <S.Container>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={""}
        options={options}
        {...props}
      />
    </S.Container>
  );
};

export { Graph };
