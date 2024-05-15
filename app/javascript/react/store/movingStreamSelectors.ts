import { createSelector } from "@reduxjs/toolkit";
import moment, { Moment } from "moment";

import { lastItemFromArray } from "../utils/lastArrayItem";
import {
  CalendarCellData,
  CalendarMonthlyData,
  StreamDailyAverage,
} from "../types/movingStream";
import { StreamDailyAverage as MovingStreamDailyAverage } from "../types/StreamDailyAverage";
import { RootState } from ".";

const DAYS_IN_WEEK_COUNT = 7;

const getMonthWeekBoundariesForDate = (
  date: Moment
): { firstDayOfMonthWeek: Moment; lastDayOfMonthWeek: Moment } => {
  const year = date.year();
  const month = date.month();
  const firstDayOfMonthWeek = moment([year, month])
    .startOf("month")
    .startOf("week");
  const lastDayOfMonthWeek = moment([year, month]).endOf("month").endOf("week");

  return { firstDayOfMonthWeek, lastDayOfMonthWeek };
};

const prepareCalendarDataCell = (
  date: Moment,
  value: number | null
): CalendarCellData => {
  return {
    date: date.format("YYYY-MM-DD"),
    dayNumber: date.format("D"),
    value,
  };
};

const getValueForDate = (
  date: string,
  streamDailyAverages: StreamDailyAverage[]
): number | null => {
  const dailyAverage = streamDailyAverages.find((item) => item.date === date);
  return dailyAverage ? dailyAverage.value : null;
};

const getMonthWeeksOfDailyAveragesFor = (
  month: Moment,
  streamDailyAverages: StreamDailyAverage[]
): CalendarMonthlyData => {
  if (!month || !month.isValid() || !streamDailyAverages) {
    throw new Error("Invalid inputs");
  }

  const { firstDayOfMonthWeek, lastDayOfMonthWeek } =
    getMonthWeekBoundariesForDate(month);
  let currentDate = firstDayOfMonthWeek.clone();

  let weeks = [];

  while (currentDate <= lastDayOfMonthWeek) {
    let week = [];
    for (let i = 0; i < DAYS_IN_WEEK_COUNT; i++) {
      const isCurrentMonth = currentDate.isSame(month, "month");

      const value = isCurrentMonth
        ? getValueForDate(currentDate.format("YYYY-MM-DD"), streamDailyAverages)
        : null;
      const calendarCellData = prepareCalendarDataCell(currentDate, value);

      week.push(calendarCellData);
      currentDate.add(1, "day");
    }
    weeks.push(week);
  }
  const dayNamesHeader = weeks[0].map((day) =>
    moment(day.date).format("dddd").substring(0, 3)
  );

  const monthName = month.format("MMMM");

  return { monthName, dayNamesHeader, weeks };
};

const sortStreamDailyAveragesByDate = (
  streamDailyAverages: StreamDailyAverage[]
): StreamDailyAverage[] => {
  return [...streamDailyAverages].sort((a, b) => {
    return moment(a.date).valueOf() - moment(b.date).valueOf();
  });
};

const getLatestDataPointDate = (
  streamDailyAverages: StreamDailyAverage[]
): string | undefined => {
  const sortedAverages = sortStreamDailyAveragesByDate(streamDailyAverages);
  const latestDataPointDate = lastItemFromArray(sortedAverages)?.date;
  return latestDataPointDate;
};

const getFullWeeksOfThreeLatestMonths = (
  streamDailyAverages: MovingStreamDailyAverage[]
): CalendarMonthlyData[] => {
  const latestDateWithData = getLatestDataPointDate(streamDailyAverages);
  const latestMomentWithData = moment(latestDateWithData);

  const secondLatestMonth = latestMomentWithData.clone().subtract(1, "month");
  const thirdLatestMonth = latestMomentWithData.clone().subtract(2, "month");
  const threeMonths = [
    thirdLatestMonth,
    secondLatestMonth,
    latestMomentWithData,
  ];

  const threeMonthsData = threeMonths.map((month) => {
    return getMonthWeeksOfDailyAveragesFor(month, streamDailyAverages);
  });

  return threeMonthsData;
};

const selectMovingCalendarData = (
  state: RootState
): MovingStreamDailyAverage[] => {
  return state.movingCalendarStream.data;
};

const selectThreeMonthsDailyAverage = createSelector(
  selectMovingCalendarData,
  (fixedStreamData): CalendarMonthlyData[] => {
    const streamDailyAverages = fixedStreamData;

    const monthData = getFullWeeksOfThreeLatestMonths(streamDailyAverages);
    return monthData;
  }
);

export { selectThreeMonthsDailyAverage };
