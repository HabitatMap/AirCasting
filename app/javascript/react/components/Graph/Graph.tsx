import React from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import * as S from "./Graph.style";
import { useSelector } from "react-redux";
import { selectFixedData, selectIsLoading } from "../../store/fixedStreamSlice";
import { selectThreshold } from "../../store/thresholdSlice";
import { SessionType, SessionTypes } from "../../types/filters";
import {
  getXAxisOptions,
  getYAxisOptions,
  plotOptions,
  seriesOptions,
  legendOption,
  getTooltipOptions,
  rangeSelectorOptions,
} from "./graphConfig";

interface GraphProps {
  sessionType: SessionType;
  streamId: number | null;
}

const Graph: React.FC<GraphProps> = ({ streamId, sessionType }) => {
  const thresholdsState = useSelector(selectThreshold);
  const isLoading = useSelector(selectIsLoading);
  const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;
  const graphData = useSelector(selectFixedData);
  const measurements = graphData?.measurements || [];
  const unitSymbol = graphData?.stream?.unitSymbol || "";
  const measurementType = "Particulate Matter"; // take this parameter from filters in the future

  const seriesData = measurements.map(
    (measurement: { time: number; value: number }) => [
      measurement.time,
      measurement.value,
    ]
  );

  const xAxisOptions = getXAxisOptions();
  const yAxisOptions = getYAxisOptions(thresholdsState);
  const tooltipOptions = getTooltipOptions(measurementType, unitSymbol);

  const options: Highcharts.Options = {
    title: undefined,
    xAxis: xAxisOptions,
    yAxis: yAxisOptions,
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
    tooltip: tooltipOptions,
    scrollbar: {
      barBackgroundColor: "#D5D4D4",
      barBorderRadius: 7,
      barBorderWidth: 0,
      buttonArrowColor: "#333333",
      buttonBorderColor: "#cccccc",
      buttonsEnabled: true,
      buttonBackgroundColor: "#eee",
      buttonBorderWidth: 0,
      buttonBorderRadius: 7,
      height: 8,
      rifleColor: "#D5D4D4",
      trackBackgroundColor: "none",
      trackBorderWidth: 0,
      showFull: true,
    },
    navigator: { enabled: false },
    rangeSelector: rangeSelectorOptions,
  };

  return (
    <S.Container>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={"stockChart"}
        options={options}
      />
      {isLoading && <div>Loading...</div>}
    </S.Container>
  );
};

export { Graph };
