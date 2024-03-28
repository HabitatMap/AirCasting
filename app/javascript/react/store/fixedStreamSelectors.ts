import { createSelector } from "@reduxjs/toolkit";
import { lastItemFromArray } from "../utils/lastArrayItem";
import {
  CalendarCellData,
  CalendarMonthlyData,
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
} from "../types/fixedStream";
import { RootState } from ".";
import moment, { Moment } from "moment";

const DAYS_IN_WEEK_COUNT = 7;

const sortStreamDailyAveragesByDate = (
  streamDailyAverages: StreamDailyAverage[]
): StreamDailyAverage[] => {
  return [...streamDailyAverages].sort((a, b) => {
    return moment(a.date).valueOf() - moment(b.date).valueOf();
  });
};

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

const getEarliestDayWithData = (
  streamDailyAverages: StreamDailyAverage[]
): string | undefined => {
  const sortedAverages = sortStreamDailyAveragesByDate(streamDailyAverages);
  const earliestDataPointDate = lastItemFromArray(sortedAverages)?.date;

  return earliestDataPointDate;
};

const getMonthWeeksOfDailyAveragesForMonth = (
  month: Moment,
  streamDailyAverages: StreamDailyAverage[]
): CalendarMonthlyData => {
  const { firstDayOfMonthWeek, lastDayOfMonthWeek } =
    getMonthWeekBoundariesForDate(month);
  let currentDate = firstDayOfMonthWeek.clone();
  let weeks = [];

  while (currentDate <= lastDayOfMonthWeek) {
    let week = [];
    for (let i = 0; i < DAYS_IN_WEEK_COUNT; i++) {
      const value = getValueForDate(
        currentDate.format("YYYY-MM-DD"),
        streamDailyAverages
      );
      const calendarCellData = prepareCalendarDataCell(currentDate, value);

      week.push(calendarCellData);
      currentDate.add(1, "day");
    }
    weeks.push(week);
  }

  const monthName = month.format("MMMM");

  return { monthName, weeks };
};

const getFullWeeksOfThreeLastMonths = (
  streamDailyAverages: StreamDailyAverage[]
): CalendarMonthlyData[] => {
  const earliestMonth = moment(getEarliestDayWithData(streamDailyAverages));
  const secondEarliestMonth = earliestMonth.clone().subtract(1, "months");
  const thirdEarliestMonth = earliestMonth.clone().subtract(2, "month");
  const threeMonths = [thirdEarliestMonth, secondEarliestMonth, earliestMonth];

  const threeMonthsData = threeMonths.map((month) => {
    return getMonthWeeksOfDailyAveragesForMonth(month, streamDailyAverages);
  });

  return threeMonthsData;
};

const selectFixedStreamData = (state: RootState): FixedStream =>
  state.fixedStream.data;

const selectLastDailyAverage = (
  state: RootState
): StreamDailyAverage | undefined => {
  const { streamDailyAverages } = selectFixedStreamData(state);

  return lastItemFromArray(streamDailyAverages);
};

const selectFixedStreamShortInfo = createSelector(
  [selectFixedStreamData, selectLastDailyAverage],
  (fixedStreamData, lastDailyAverage): FixedStreamShortInfo => {
    const { value: lastMeasurementValue, date } = lastDailyAverage || {};
    const lastMeasurementDateLabel = moment(date).format("MMM D");

    return {
      ...fixedStreamData.stream,
      lastMeasurementValue,
      lastMeasurementDateLabel,
    };
  }
);

const selectLastThreeMonthsDailyAverages = (
  state: RootState
): CalendarMonthlyData[] => {
  const { streamDailyAverages } = selectFixedStreamData(state);

  const monthData = getFullWeeksOfThreeLastMonths(streamDailyAverages);
  return monthData;
};

export {
  selectFixedStreamData,
  selectFixedStreamShortInfo,
  selectLastThreeMonthsDailyAverages,
};
