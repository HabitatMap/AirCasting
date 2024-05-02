import { createSelector } from "@reduxjs/toolkit";
import moment, { Moment } from "moment";

import { lastItemFromArray } from "../utils/lastArrayItem";
import {
  CalendarCellData,
  CalendarMonthlyData,
  FixedStream,
  FixedStreamShortInfo,
  StreamDailyAverage,
  FixedStreamStationInfo,
  Measurement,
} from "../types/fixedStream";
import { MovingStreamDailyAverage } from "../types/movingCalendarStream";
import { RootState } from ".";

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

const getLatestDataPointDate = (
  streamDailyAverages: StreamDailyAverage[]
): string | undefined => {
  const sortedAverages = sortStreamDailyAveragesByDate(streamDailyAverages);
  const latestDataPointDate = lastItemFromArray(sortedAverages)?.date;
  return latestDataPointDate;
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

const getFullWeeksOfThreeLatestMonths = (
  streamDailyAverages: MovingStreamDailyAverage[]
): CalendarMonthlyData[] => {
  const latestDateWithData = getLatestDataPointDate(streamDailyAverages);
  const latestMomentWithData = moment(latestDateWithData);
  console.log("000", latestMomentWithData);

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

const selectMovingCalendarData = (state: RootState): MovingStreamDailyAverage[] => {
  return state.movingCalendarStream.data;
}

const selectFixedStreamData = (state: RootState): FixedStream => {
  return state.fixedStream.data;
}


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
    const active = fixedStreamData.stream.active;
    const sessionId = fixedStreamData.stream.sessionId;
    const lastUpdate = moment(fixedStreamData.stream.lastUpdate)
      .local()
      .format("HH:mm, MMM D YYYY");

    return {
      ...fixedStreamData.stream,
      lastMeasurementValue,
      lastMeasurementDateLabel,
      lastUpdate,
      active,
      sessionId,
    };
  }
);

const selectThreeMonthsDailyAverage = createSelector(
  selectMovingCalendarData,
  (fixedStreamData): CalendarMonthlyData[] => {
    const streamDailyAverages = fixedStreamData;
    console.log("###", streamDailyAverages)

    const monthData = getFullWeeksOfThreeLatestMonths(streamDailyAverages);
    console.log(monthData)
    return monthData;
  }
);

export {
  selectFixedStreamData,
  selectFixedStreamShortInfo,
  selectThreeMonthsDailyAverage,
};
