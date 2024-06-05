import React from "react";
import Highcharts, {
  TooltipFormatterContextObject,
  Point,
} from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

import * as S from "./Graph.style";
import {
  xAxisOption,
  plotOptions,
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
  const unitSymbol = fixedStreamData?.stream.unitSymbol || "";
  const measurementType = "Particulate Matter"; // take this parameter from filters in the future

  const seriesData = measurements.map((measurement) => [
    measurement.time,
    measurement.value,
  ]);

  const yAxisOption = getYAxisOption(thresholdsState);

  const onMouseOverSingle = (latLng: {
    latitude: number;
    longitude: number;
  }) => {
    console.log(latLng);
  };

  const onMouseOverMultiple = (xLess: number, xMore: number) => {
    console.log(xLess, xMore);
  };

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
    responsive,
    tooltip: {
      formatter: function (this: TooltipFormatterContextObject): string {
        const pointData = this.points ? this.points[0] : this.point;
        const { series } = pointData;
        let s = `<span>${Highcharts.dateFormat("%m/%d/%Y", Number(this.x))} `;

        s += `<br/>${measurementType} = ${Math.round(
          pointData.y ?? 0
        )} ${unitSymbol}`;
        return s;
      },
    },
  };

  return (
    <S.Container>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={"chart"}
        options={options}
        {...props}
      />
    </S.Container>
  );
};

export { Graph };
