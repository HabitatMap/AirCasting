import moment, { Moment } from "moment";

const getDayNumber = (date: string) => moment(date).format("D");

export { getDayNumber };
