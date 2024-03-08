import moment from "moment";

const today = moment();

const getFullWeeksOfMonth = (year: number, month: number): string[][] => {
  let start = moment([year, month]).startOf("month").startOf("week");
  let end = moment([year, month]).endOf("month").endOf("week");
  const DAYS_IN_WEEK_COUNT = 7;

  let weeks = [];
  while (start <= end) {
    let week = [];
    for (let i = 0; i < DAYS_IN_WEEK_COUNT; i++) {
      week.push(start.clone().add(i, "days").format("YYYY-MM-DD"));
    }
    weeks.push(week);
    start.add(1, "week");
  }
  return weeks;
};

const getDayNumber = (date: string) => moment(date).format("D");

export { today, getFullWeeksOfMonth, getDayNumber };
