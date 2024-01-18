import React from "react";

import Highcharts from "highcharts";
import heatmap from "highcharts/modules/heatmap";
import HighchartsReact from "highcharts-react-official";

import {
  darkGray,
  white,
  calendarGreen,
  calendarYellow,
  calendarOrange,
  calendarRed,
} from "../../assets/styles/colors";

heatmap(Highcharts);

const CalendarHeatmap: React.FC = () => {
  const mockedData = [
    {
      date: "2023-07-01",
      value: 19.1,
    },
    {
      date: "2023-07-02",
      value: 15.3,
    },
    {
      date: "2023-07-03",
      value: 16.4,
    },
    {
      date: "2023-07-04",
      value: 16.0,
    },
    {
      date: "2023-07-05",
      value: 17.9,
    },
    {
      date: "2023-07-06",
      value: 15.8,
    },
    {
      date: "2023-07-07",
      value: 21.1,
    },
    {
      date: "2023-07-08",
      value: 23.3,
    },
    {
      date: "2023-07-09",
      value: 24.8,
    },
    {
      date: "2023-07-10",
      value: 25.1,
    },
    {
      date: "2023-07-11",
      value: 18.2,
    },
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function generateChartData(data: string | any[]) {
    const firstWeekday = new Date(data[0].date).getDay(),
      monthLength = data.length,
      lastElement = data[monthLength - 1].date,
      lastWeekday = new Date(lastElement).getDay(),
      lengthOfWeek = 6,
      emptyTilesFirst = firstWeekday,
      chartData = [];

    for (let emptyDay = 0; emptyDay < emptyTilesFirst; emptyDay++) {
      chartData.push({
        x: emptyDay,
        y: 5,
        value: null,
        date: null,
        custom: {
          empty: true,
        },
      });
    }

    for (let day = 1; day <= monthLength; day++) {
      // Get date from the given data array
      const date = data[day - 1].date;
      // Offset by the number of empty tiles
      const xCoordinate = (emptyTilesFirst + day - 1) % 7;
      const yCoordinate = Math.floor((firstWeekday + day - 1) / 7);
      const id = day;
      // Get the corresponding measurement for the current day from the given
      // array
      const measurement = data[day - 1].value;

      chartData.push({
        x: xCoordinate,
        y: 5 - yCoordinate,
        value: measurement,
        date: new Date(date).getTime(),
        custom: {
          monthDay: id,
        },
      });
    }

    // Fill in the missing values when dataset is looped through.
    const emptyTilesLast = lengthOfWeek - lastWeekday;
    for (let emptyDay = 1; emptyDay <= emptyTilesLast; emptyDay++) {
      chartData.push({
        x: (lastWeekday + emptyDay) % 7,
        y: 0,
        value: null,
        date: null,
        custom: {
          empty: true,
        },
      });
    }
    return chartData;
  }
  const chartData = generateChartData(mockedData);

  const options = {
    chart: {
      type: "heatmap",
    },
    accessibility: {
      landmarkVerbosity: "one",
    },
    tooltip: {
      enabled: true,
      outside: true,
      zIndex: 20,
      headerFormat: "",
      pointFormat:
        "{#unless point.custom.empty}{point.date:%A, %b %e, %Y}{/unless}",
      nullFormat: "No data",
    },
    xAxis: {
      categories: weekdays,
      opposite: true,
      lineWidth: 26,
      offset: 13,
      lineColor: "rgba(27, 26, 37, 0.2)",
      labels: {
        rotation: 0,
        y: 20,
        style: {
          textTransform: "uppercase",
          fontWeight: "bold",
        },
      },
      accessibility: {
        description: "weekdays",
        rangeDescription:
          "X Axis is showing all 7 days of the week, starting with Sunday.",
      },
    },
    yAxis: {
      min: 0,
      max: 5,
      accessibility: {
        description: "weeks",
      },
      visible: false,
    },

    colorAxis: {
      min: 0,
      stops: [
        [0.2, calendarGreen],
        [0.4, calendarYellow],
        [0.6, calendarOrange],
        [0.9, calendarRed],
      ],
      labels: {
        format: "PM2",
      },
    },

    series: [
      {
        keys: ["x", "y", "value", "date", "id"],
        data: chartData,
        nullColor: white,
        dataLabels: [
          {
            enabled: true,
            align: "right",
            verticalAlign: "top",
            format:
              "{#unless point.custom.empty}{point.custom.monthDay}{/unless}",
            padding: 2,
            style: {
              textOutline: "none",
              color: darkGray,
              fontWeight: "bold",
              fontSize: "18px",
              opacity: 0.5,
            },
            x: 1,
            y: 1,
          },
        ],
      },
    ],
  };
  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export { CalendarHeatmap };
