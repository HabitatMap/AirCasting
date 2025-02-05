import { createSelector } from "@reduxjs/toolkit";
import moment, { Moment } from "moment";

import { RootState } from ".";

import { DateFormat } from "../types/dateFormat";
import {
  CalendarCellData,
  CalendarMonthlyData,
  StreamDailyAverage,
} from "../types/movingStream";
import { StreamDailyAverage as MovingStreamDailyAverage } from "../types/StreamDailyAverage";

const WEEKDAYS_COUNT = 7;

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
    for (let i = 0; i < WEEKDAYS_COUNT; i++) {
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

const getVisibleMonthsData = (
  streamDailyAverages: MovingStreamDailyAverage[],
  startDate: string,
  endDate: string
): MovingStreamDailyAverage[] => {
  if (!streamDailyAverages || !startDate || !endDate) return [];

  const startMoment = moment(startDate, DateFormat.us).startOf("day");
  const endMoment = moment(endDate, DateFormat.us).endOf("day");

  return streamDailyAverages.filter((average) => {
    const dateMoment = moment(average.date, DateFormat.default);
    return dateMoment.isBetween(startMoment, endMoment, "day", "[]");
  });
};

const _selectMovingCalendarData = (
  state: RootState
): MovingStreamDailyAverage[] => {
  return state.movingCalendarStream.data;
};

const selectThreeMonthsDailyAverage = createSelector(
  [
    _selectMovingCalendarData,
    (_state: RootState, startDate?: string, endDate?: string) => ({
      startDate,
      endDate,
    }),
  ],
  (calendarData, { startDate, endDate }): CalendarMonthlyData[] => {
    if (!calendarData || calendarData.length === 0) {
      return [];
    }

    if (!startDate || !endDate) {
      return [];
    }

    const visibleData =
      startDate && endDate
        ? getVisibleMonthsData(calendarData, startDate, endDate)
        : calendarData;

    const endMoment = moment(endDate, DateFormat.us);
    if (!endMoment.isValid()) {
      return [];
    }

    const latestMomentWithData = endMoment.clone().endOf("month");
    const secondLatestMonth = latestMomentWithData.clone().subtract(1, "month");
    const thirdLatestMonth = latestMomentWithData.clone().subtract(2, "month");

    if (
      !latestMomentWithData.isValid() ||
      !secondLatestMonth.isValid() ||
      !thirdLatestMonth.isValid()
    ) {
      return [];
    }

    const threeMonths = [
      thirdLatestMonth,
      secondLatestMonth,
      latestMomentWithData,
    ];

    try {
      const threeMonthsData = threeMonths.map((month) =>
        getMonthWeeksOfDailyAveragesFor(month, visibleData)
      );

      return threeMonthsData;
    } catch (error) {
      console.error("Error generating calendar data:", error);
      return [];
    }
  }
);

const selectMovingCalendarMinMax = createSelector(
  _selectMovingCalendarData,
  (calendarData) => {
    if (!calendarData || calendarData.length === 0) {
      return { min: null, max: null };
    }

    const values = calendarData.map((entry) => entry.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { min, max };
  }
);

export { selectMovingCalendarMinMax, selectThreeMonthsDailyAverage };
