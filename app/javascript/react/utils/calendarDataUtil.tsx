import moment from "moment";

const getDayNumber = (date: string): string => moment(date).format("D");

export { getDayNumber };
