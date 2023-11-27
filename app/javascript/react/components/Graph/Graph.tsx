import React from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
// https://api.highcharts.com/highcharts/plotOptions

import * as S from "./Graph.style";
import { graphGreen, graphOrange, graphRed, graphYellow, white, tickDarkGray, tickLightGray } from "../../assets/styles/colors";

const data = [
  [1636381800000, 150.44],
  [1636468200000, 150.81],
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
  title: {
    text: "Measurement graph",
    align: "left",
  },
  xAxis: {
    title: {
      text: undefined,
    },
    tickColor: tickLightGray,
    lineColor: white,
    type: "datetime",
    labels: {
      overflow: "justify",
    },
  },
  yAxis: {
    title: {
      text: undefined,
    },
    endOnTick: false,
    startOnTick: false,
    tickColor: tickDarkGray,
    lineColor: white,
    opposite: true,
    tickWidth: 1,
    minorGridLineWidth: 0,
    gridLineWidth: 0,
    plotBands: [
      {
        from: 0,
        to: 100,
        color: graphGreen,
      },
      {
        from: 100,
        to: 130,
        color: graphYellow,
      },
      {
        from: 130,
        to: 150,
        color: graphOrange,
      },
      {
        from: 150,
        to: 210,
        color: graphRed,
      }
    ],
  },
  plotOptions: {
    spline: {
      lineWidth: 3,
      marker: {
        enabled: false
      }
    }
  },
  series: [
    {
      type: "spline",
      color: white,
      data: data,
      tooltip: {
        valueDecimals: 2,
      },
    },
  ],
  legend: {
    enabled: false,
  },
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
