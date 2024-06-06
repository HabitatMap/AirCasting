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

  const tooltipOptions = {
    formatter: function (this: TooltipFormatterContextObject): string {
      const date = Highcharts.dateFormat("%m/%d/%Y", Number(this.x));
      const time = Highcharts.dateFormat("%H:%M:%S", Number(this.x));
      const pointData = this.points ? this.points[0] : this.point;
      const oneMinuteInterval = 60 * 1000; // 1 minute interval in milliseconds
      let s = `<span>${date} `;

      if (this.points && this.points.length > 1) {
        const xLess = Number(this.x);
        const xMore = xLess + oneMinuteInterval * (this.points.length - 1);
        s += Highcharts.dateFormat("%H:%M:%S", xLess) + "-";
        s += Highcharts.dateFormat("%H:%M:%S", xMore) + "</span>";
      } else {
        s += Highcharts.dateFormat("%H:%M:%S", this.x as number) + "</span>";
      }
      s +=
        "<br/>" +
        measurementType +
        " = " +
        Math.round(Number(pointData.y)) +
        " " +
        unitSymbol;
      return s;
    },
    borderWidth: 0,
    style: {
      fontSize: "1.2rem",
      fontFamily: "Roboto",
    },
  };

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
    tooltip: tooltipOptions,
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
