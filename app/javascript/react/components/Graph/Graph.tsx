import React, { useEffect } from "react";
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
} from "./graphConfig";
import { useSelector } from "react-redux";
import { selectFixedData } from "../../store/fixedStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";
import graphChevronLeft from "../../assets/icons/graphChevronLeft.svg";
import graphChevronRight from "../../assets/icons/graphChevronRight.svg";

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
      borderRadius: 10,
      scrollablePlotArea: {
        minWidth: 1000,
        scrollPositionX: 1,
        minHeight: 200,
      },
      events: {
        load: function () {
          const chart = this;
          const chartContainer = chart.container;
          const chartWidth = chartContainer.offsetWidth;

          const moveLeft = () => {
            let { min, max, dataMin } = chart.xAxis[0].getExtremes();
            if (min - 3 >= dataMin) {
              min -= 3;
              max -= 3;
            }
            chart.xAxis[0].setExtremes(min, max);
          };

          const moveRight = () => {
            let { min, max, dataMax } = chart.xAxis[0].getExtremes();
            if (max + 3 <= dataMax) {
              min += 3;
              max += 3;
            }
            chart.xAxis[0].setExtremes(min, max);
          };

          const leftArrowUrl = graphChevronLeft;
          const rightArrowUrl = graphChevronRight;

          const leftArrow = chart.renderer
            .image(leftArrowUrl, 20, 80, 30, 30)
            .attr({ zIndex: 10 });
          const rightArrow = chart.renderer
            .image(rightArrowUrl, chartWidth - 80, 80, 30, 30)
            .attr({ zIndex: 10 });

          leftArrow.on("click", moveLeft).add();
          rightArrow.on("click", moveRight).add();
        },
        redraw: function () {
          const chart = this;
          const chartContainer = chart.container;
          const chartWidth = chartContainer.offsetWidth;

          const rightArrow = chart.renderer
            .image(graphChevronRight, chartWidth - 80, 80, 30, 30)
            .attr({ zIndex: 10 });

          rightArrow
            .on("click", function () {
              let { min, max, dataMax } = chart.xAxis[0].getExtremes();
              if (max + 3 <= dataMax) {
                min += 3;
                max += 3;
              }
              chart.xAxis[0].setExtremes(min, max);
            })
            .add();
        },
      },
    },
    responsive,
    tooltip: tooltipOptions,
    scrollbar: {
      enabled: true,
      buttonsEnabled: true,
      barBackgroundColor: "#D5D4D4",
      barBorderRadius: 7,
      barBorderWidth: 0,
      buttonArrowColor: "#333333",
      buttonBorderColor: "#cccccc",
      buttonBackgroundColor: "#eee",
      buttonBorderWidth: 0,
      buttonBorderRadius: 7,
      height: 12,
      rifleColor: "#D5D4D4",
      trackBackgroundColor: "none",
      trackBorderWidth: 0,
      showFull: true,
    },
    navigator: {
      enabled: false,
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
