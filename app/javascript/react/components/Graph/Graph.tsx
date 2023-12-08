import React from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

import * as S from "./Graph.style";
import {
  xAxisOption,
  yAxisOption,
  plotOptions,
  titleOption,
  legendOption,
  seriesOption,
} from "./graphConfig";

const mockedData = [
  [1636329600000, 150.44],
  [1636502400000, 150.81],
  [1636554600000, 147.92],
  [1636641000000, 147.87],
  [1636727400000, 149.99],
  [1636986600000, 150],
  [1637073000000, 151],
  [1637159400000, 153.49],
  [1637245800000, 157.87],
  [1637332200000, 160.55],
  [1637591400000, 161.02],
  [1637677800000, 161.41],
  [1637764200000, 161.94],
  [1637937000000, 156.81],
  [1638196200000, 160.24],
  [1638282600000, 165.3],
  [1638369000000, 164.77],
  [1638455400000, 163.76],
  [1638541800000, 161.84],
  [1638801000000, 165.32],
  [1638887400000, 171.18],
  [1638973800000, 175.08],
  [1639060200000, 174.56],
  [1639146600000, 179.45],
  [1639405800000, 100.74],
];

const options: Highcharts.Options = {
  title: titleOption,
  xAxis: xAxisOption,
  yAxis: yAxisOption,
  plotOptions,
  series: [seriesOption(mockedData)],
  legend: legendOption,
};

const Graph = (props: HighchartsReact.Props) => {
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
