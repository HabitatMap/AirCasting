import moment from "moment";

import {
  CalendarCellData,
  CalendarMonthlyData,
  StreamDailyAverage,
} from "../types/fixedStream";
import { lastItemFromArray } from "./lastArrayItem";

const DAYS_IN_WEEK_COUNT = 7;

const getFullWeeksOfMonth = (
  streamDailyAverages: StreamDailyAverage[]
): CalendarMonthlyData => {
  const sortedAverages = [...streamDailyAverages].sort((a, b) => {
    return moment(a.date).valueOf() - moment(b.date).valueOf();
  });
  const lastDailyAverageDate = lastItemFromArray(sortedAverages)?.date;
  const monthName = moment(lastDailyAverageDate).format("MMMM");

  const year = moment(lastDailyAverageDate).year();
  const month = moment(lastDailyAverageDate).month();
  const firstDayOfMonthWeek = moment([year, month])
    .startOf("month")
    .startOf("week");
  const lastDayOfMonthWeek = moment([year, month]).endOf("month").endOf("week");

  let currentDate = firstDayOfMonthWeek.clone();
  let weeks = [];

  while (currentDate <= lastDayOfMonthWeek) {
    let week = [];
    for (let i = 0; i < DAYS_IN_WEEK_COUNT; i++) {
      const calendarCellData: CalendarCellData = {
        date: currentDate.format("YYYY-MM-DD"),
        value: findValueForDate(
          currentDate.format("YYYY-MM-DD"),
          streamDailyAverages
        ),
      };
      week.push(calendarCellData);
      currentDate.add(1, "day");
    }
    weeks.push(week);
  }

  return { monthName, weeks };
};

const findValueForDate = (
  date: string,
  streamDailyAverages: StreamDailyAverage[]
): number | null => {
  const dailyAverage = streamDailyAverages.find((item) => item.date === date);
  return dailyAverage ? dailyAverage.value : null;
};

const getDayNumber = (date: string) => moment(date).format("D");

export { getFullWeeksOfMonth, getDayNumber };
