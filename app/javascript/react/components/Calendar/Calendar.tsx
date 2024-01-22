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
    { date: "2023-07-01", value: 19.1 },
    { date: "2023-07-02", value: 15.3 },
    { date: "2023-07-03", value: 16.4 },
    { date: "2023-07-05", value: 17.9 },
    { date: "2023-07-06", value: 15.8 },
    { date: "2023-07-07", value: 21.1 },
    { date: "2023-07-08", value: 23.3 },
    { date: "2023-07-10", value: 25.1 },
    { date: "2023-07-11", value: 18.2 },
  ];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  interface ChartDataItem {
    x: number;
    y: number;
    value?: number | null;
    date?: number;
    custom: {
      empty: boolean;
      monthDay: number;
    };
  }

  function isEmptyTile(value: number | null): boolean {
    return value === null;
  }

  function generateChartDataItem(
    day: number,
    firstWeekday: number,
    data: { date: string; value: number }
  ): ChartDataItem {
    const date = new Date(data.date);
    const xCoordinate = (firstWeekday + day - 1) % 7;
    const yCoordinate = Math.floor((firstWeekday + day - 1) / 7);
    const dayNumber = day;

    return {
      x: xCoordinate,
      y: 5 - yCoordinate,
      value: isEmptyTile(data.value) ? null : data.value,
      date: date.getTime(),
      custom: {
        empty: isEmptyTile(data.value),
        monthDay: dayNumber,
      },
    };
  }

  function generateEmptyDataItem(
    day: number,
    firstWeekday: number
  ): ChartDataItem {
    return {
      x: (firstWeekday + day - 1) % 7,
      y: 5 - Math.floor((firstWeekday + day - 1) / 7),
      custom: { empty: true, monthDay: day },
    };
  }

  function generateChartData(
    data: { date: string; value: number }[]
  ): ChartDataItem[] {
    const firstDayOfMonth = new Date(data[0].date);
    const firstWeekday = firstDayOfMonth.getDay();
    const monthLength = new Date(
      firstDayOfMonth.getFullYear(),
      firstDayOfMonth.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: monthLength }, (_, day) => {
      const dataItem = data.find((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getDate() === day + 1 &&
          itemDate.getMonth() === firstDayOfMonth.getMonth()
        );
      });

      return dataItem
        ? generateChartDataItem(day + 1, firstWeekday, dataItem)
        : generateEmptyDataItem(day + 1, firstWeekday);
    });
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
      enabled: false,
    },
    xAxis: {
      categories: weekdays,
      opposite: true,
      lineWidth: 50,
      offset: 15,
      lineColor: white,
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
      min: -10000,
      stops: [
        [0, calendarGreen],
        [0.4, calendarYellow],
        [0.6, calendarOrange],
        [0.9, calendarRed],
      ],
      labels: {
        format: "PM2",
      },
    },

    plotOptions: {
      heatmap: {
        states: {
          hover: {
            enabled: false,
          },
        },
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
