import moment from "moment";

export const formattedTime = (time: string, format: string) => {
  return moment.utc(time).format(format);
};
