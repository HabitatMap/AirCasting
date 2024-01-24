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

const Calendar: React.FC = () => {
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

export { Calendar };

// // The function takes in a dataset and calculates how many empty tiles needed
// // before and after the dataset is plotted.
// function generateChartData(data) {
//   // Calculate the starting weekday index (0-6 of the first date in the given
//   // array)
//   const firstWeekday = new Date(data[0].date).getDay(),
//     monthLength = data.length,
//     lastElement = data[monthLength - 1].date,
//     lastWeekday = new Date(lastElement).getDay(),
//     lengthOfWeek = 6,
//     emptyTilesFirst = firstWeekday,
//     chartData = [];

//   // Add the empty tiles before the first day of the month with null values to
//   // take up space in the chart
//   for (let emptyDay = 0; emptyDay < emptyTilesFirst; emptyDay++) {
//     chartData.push({
//       x: emptyDay,
//       y: 5,
//       value: null,
//       date: null,
//       custom: {
//         empty: true,
//       },
//     });
//   }

//   // Loop through and populate with temperature and dates from the dataset
//   for (let day = 1; day <= monthLength; day++) {
//     // Get date from the given data array
//     const date = data[day - 1].date;
//     // Offset by thenumber of empty tiles
//     const xCoordinate = (emptyTilesFirst + day - 1) % 7;
//     const yCoordinate = Math.floor((firstWeekday + day - 1) / 7);
//     const id = day;

//     // Get the corresponding temperature for the current day from the given
//     // array
//     const temperature = data[day - 1].temperature;

//     chartData.push({
//       x: xCoordinate,
//       y: 5 - yCoordinate,
//       value: temperature,
//       date: new Date(date).getTime(),
//       custom: {
//         monthDay: id,
//       },
//     });
//   }

//   // Fill in the missing values when dataset is looped through.
//   const emptyTilesLast = lengthOfWeek - lastWeekday;
//   for (let emptyDay = 1; emptyDay <= emptyTilesLast; emptyDay++) {
//     chartData.push({
//       x: (lastWeekday + emptyDay) % 7,
//       y: 0,
//       value: null,
//       date: null,
//       custom: {
//         empty: true,
//       },
//     });
//   }
//   return chartData;
// }
// const chartData = generateChartData(data);

// Highcharts.chart("container", {
//   chart: {
//     type: "heatmap",
//   },

//   title: {
//     text: "Day temperature in Oslo, Norway July 2023",
//     align: "left",
//   },

//   subtitle: {
//     text: "Temperature variation at day through July",
//     align: "left",
//   },

//   accessibility: {
//     landmarkVerbosity: "one",
//   },

//   tooltip: {
//     enabled: true,
//     outside: true,
//     zIndex: 20,
//     headerFormat: "",
//     pointFormat:
//       "{#unless point.custom.empty}{point.date:%A, %b %e, %Y}{/unless}",
//     nullFormat: "No data",
//   },

//   xAxis: {
//     categories: weekdays,
//     opposite: true,
//     lineWidth: 26,
//     offset: 13,
//     lineColor: "rgba(27, 26, 37, 0.2)",
//     labels: {
//       rotation: 0,
//       y: 20,
//       style: {
//         textTransform: "uppercase",
//         fontWeight: "bold",
//       },
//     },
//     accessibility: {
//       description: "weekdays",
//       rangeDescription:
//         "X Axis is showing all 7 days of the week, starting with Sunday.",
//     },
//   },

//   yAxis: {
//     min: 0,
//     max: 5,
//     accessibility: {
//       description: "weeks",
//     },
//     visible: false,
//   },

//   legend: {
//     align: "right",
//     layout: "vertical",
//     verticalAlign: "middle",
//   },

//   colorAxis: {
//     min: 0,
//     stops: [
//       [0.2, "lightblue"],
//       [0.4, "#CBDFC8"],
//       [0.6, "#F3E99E"],
//       [0.9, "#F9A05C"],
//     ],
//     labels: {
//       format: "{value} °C",
//     },
//   },

//   series: [
//     {
//       keys: ["x", "y", "value", "date", "id"],
//       data: chartData,
//       nullColor: "rgba(196, 196, 196, 0.2)",
//       borderWidth: 2,
//       borderColor: "rgba(196, 196, 196, 0.2)",
//       dataLabels: [
//         {
//           enabled: true,
//           format: "{#unless point.custom.empty}{point.value:.1f}°{/unless}",
//           style: {
//             textOutline: "none",
//             fontWeight: "normal",
//             fontSize: "1rem",
//           },
//           y: 4,
//         },
//         {
//           enabled: true,
//           align: "left",
//           verticalAlign: "top",
//           format:
//             "{#unless point.custom.empty}{point.custom.monthDay}{/unless}",
//           backgroundColor: "whitesmoke",
//           padding: 2,
//           style: {
//             textOutline: "none",
//             color: "rgba(70, 70, 92, 1)",
//             fontSize: "0.8rem",
//             fontWeight: "bold",
//             opacity: 0.5,
//           },
//           x: 1,
//           y: 1,
//         },
//       ],
//     },
//   ],
// });
