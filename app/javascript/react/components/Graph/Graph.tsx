import React from "react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

import * as S from "./Graph.style";
import { measurementGraphConfig } from "./graphConfig";

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
  [1639405800000, 175.74],
];

const options: Highcharts.Options = {
  title: {
    text: "Measurement graph",
    align: "left",
  },
  xAxis: {
    type: "datetime",
    labels: {
      overflow: "justify",
    },
  },
  yAxis: {
    title: {
      text: "Wind speed (m/s)",
    },
    minorGridLineWidth: 0,
    gridLineWidth: 0,
    plotBands: [
      {
        // Light air
        from: 0,
        to: 150,
        color: "rgba(68, 170, 213, 0.1)",
        label: {
          style: {
            color: "#ff6060",
          },
        },
      },
      {
        // Light breeze
        from: 1.5,
        to: 3.3,
        color: "rgba(0, 0, 0, 0)",
        label: {
          text: "Light breeze",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Gentle breeze
        from: 3.3,
        to: 5.5,
        color: "rgba(68, 170, 2, 0.1)",
        label: {
          text: "Gentle breeze",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Moderate breeze
        from: 5.5,
        to: 8,
        color: "rgba(100, 90, 200, 1)",
        label: {
          text: "Moderate breeze",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Fresh breeze
        from: 8,
        to: 11,
        color: "rgba(68, 170, 213, 0.1)",
        label: {
          text: "Fresh breeze",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Strong breeze
        from: 11,
        to: 14,
        color: "rgba(0, 0, 0, 0)",
        label: {
          text: "Strong breeze",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Near Gale
        from: 14,
        to: 17,
        color: "rgba(68, 170, 213, 0.1)",
        label: {
          text: "Near gale",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Fresh Gale
        from: 17,
        to: 20.5,
        color: "rgba(0, 0, 0, 0)",
        label: {
          text: "Fresh gale",
          style: {
            color: "#606060",
          },
        },
      },
      {
        // Strong Gale
        from: 20.5,
        to: 24,
        color: "rgba(68, 170, 213, 0.1)",
        label: {
          text: "Strong gale",
          style: {
            color: "#606060",
          },
        },
      },
    ],
  },

  series: [
    {
      type: "line",
      data: data,
      tooltip: {
        valueDecimals: 2,
      },
    },
  ],
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
