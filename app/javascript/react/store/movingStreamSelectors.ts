import { createSelector } from "@reduxjs/toolkit";
import { memoize } from "lodash";
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

const getMonthWeeksOfDailyAveragesFor = memoize(
  (
    month: Moment,
    streamDailyAverages: StreamDailyAverage[]
  ): CalendarMonthlyData => {
    if (!month || !month.isValid() || !streamDailyAverages) {
      throw new Error("Invalid inputs");
    }

    const { firstDayOfMonthWeek, lastDayOfMonthWeek } =
      getMonthWeekBoundariesForDate(month);
    let currentDate = firstDayOfMonthWeek.clone();

    const weeks = [];
    while (currentDate <= lastDayOfMonthWeek) {
      const week = [];
      for (let i = 0; i < WEEKDAYS_COUNT; i++) {
        const isCurrentMonth = currentDate.isSame(month, "month");
        const value = isCurrentMonth
          ? getValueForDate(
              currentDate.format("YYYY-MM-DD"),
              streamDailyAverages
            )
          : null;
        week.push(prepareCalendarDataCell(currentDate.clone(), value));
        currentDate.add(1, "day");
      }
      weeks.push(week);
    }

    const dayNamesHeader = weeks[0].map((day) =>
      moment(day.date).format("dddd").substring(0, 3)
    );

    return {
      monthName: month.format("MMMM"),
      dayNamesHeader,
      weeks,
    };
  },
  (month: Moment, streamDailyAverages: StreamDailyAverage[]) =>
    `${month.format("YYYY-MM")}-${JSON.stringify(streamDailyAverages)}`
);

const getVisibleMonthsData = memoize(
  (
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
  },
  (streamDailyAverages, startDate, endDate) =>
    `${startDate}-${endDate}-${streamDailyAverages.length}`
);

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
    const emptyResult: CalendarMonthlyData[] = [];
    if (!calendarData?.length || !startDate || !endDate) {
      return emptyResult;
    }

    const endMoment = moment(endDate, DateFormat.us);
    if (!endMoment.isValid()) {
      return emptyResult;
    }

    const visibleData = getVisibleMonthsData(calendarData, startDate, endDate);

    const latestMomentWithData = endMoment.clone().endOf("month");
    const secondLatestMonth = latestMomentWithData.clone().subtract(1, "month");
    const thirdLatestMonth = latestMomentWithData.clone().subtract(2, "month");

    if (
      !latestMomentWithData.isValid() ||
      !secondLatestMonth.isValid() ||
      !thirdLatestMonth.isValid()
    ) {
      return emptyResult;
    }

    const threeMonths = [
      thirdLatestMonth,
      secondLatestMonth,
      latestMomentWithData,
    ];

    try {
      return threeMonths.map((month) =>
        getMonthWeeksOfDailyAveragesFor(month, visibleData)
      );
    } catch (error) {
      console.error("Error generating calendar data:", error);
      return emptyResult;
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

const selectEmptyCalendarData = createSelector(
  [_selectMovingCalendarData],
  (calendarData): CalendarMonthlyData[] => {
    const emptyResult: CalendarMonthlyData[] = [];
    if (!calendarData?.length) {
      return emptyResult;
    }

    // Use current date for empty calendar
    const now = moment();
    const endDate = now.format(DateFormat.us);
    const startDate = now.clone().subtract(3, "months").format(DateFormat.us);

    const visibleData = getVisibleMonthsData(calendarData, startDate, endDate);

    const latestMonth = now.clone().startOf("month");
    const secondMonth = latestMonth.clone().subtract(1, "month");
    const thirdMonth = latestMonth.clone().subtract(2, "month");

    const threeMonths = [thirdMonth, secondMonth, latestMonth];

    try {
      return threeMonths.map((month) =>
        getMonthWeeksOfDailyAveragesFor(month, visibleData)
      );
    } catch (error) {
      console.error("Error generating calendar data:", error);
      return emptyResult;
    }
  }
);

const selectCalendarData = createSelector(
  [
    _selectMovingCalendarData,
    (_state: RootState, startDate?: string, endDate?: string) =>
      startDate && endDate ? `${startDate}-${endDate}` : "",
  ],
  (calendarData, dateKey): CalendarMonthlyData[] => {
    const emptyResult: CalendarMonthlyData[] = [];
    if (!calendarData?.length || !dateKey) {
      return emptyResult;
    }

    const [startDate, endDate] = dateKey.split("-");
    if (!startDate || !endDate) {
      return emptyResult;
    }

    const endMoment = moment(endDate, DateFormat.us);
    if (!endMoment.isValid()) {
      return emptyResult;
    }

    const visibleData = getVisibleMonthsData(calendarData, startDate, endDate);

    const latestMomentWithData = endMoment.clone().endOf("month");
    const secondLatestMonth = latestMomentWithData.clone().subtract(1, "month");
    const thirdLatestMonth = latestMomentWithData.clone().subtract(2, "month");

    if (
      !latestMomentWithData.isValid() ||
      !secondLatestMonth.isValid() ||
      !thirdLatestMonth.isValid()
    ) {
      return emptyResult;
    }

    const threeMonths = [
      thirdLatestMonth,
      secondLatestMonth,
      latestMomentWithData,
    ];

    try {
      return threeMonths.map((month) =>
        getMonthWeeksOfDailyAveragesFor(month, visibleData)
      );
    } catch (error) {
      console.error("Error generating calendar data:", error);
      return emptyResult;
    }
  }
);

export {
  selectCalendarData,
  selectEmptyCalendarData,
  selectMovingCalendarMinMax,
  selectThreeMonthsDailyAverage,
};
