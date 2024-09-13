import { SeriesDataPoint } from "../types/graph";

export const getTimeRangeFromSelectedRange = (
  range: number,
  seriesData: SeriesDataPoint[],
  fixedSessionTypeSelected: boolean
) => {
  const lastTimestamp =
    seriesData.length > 0
      ? fixedSessionTypeSelected
        ? (seriesData[seriesData.length - 1] as number[])[0]
        : (seriesData[seriesData.length - 1] as { x: number }).x
      : Date.now();

  let startTime = new Date(lastTimestamp);
  switch (range) {
    case 0:
      startTime.setHours(startTime.getHours() - 24);
      break;
    case 1:
      startTime.setDate(startTime.getDate() - 7);
      break;
    case 2:
      startTime.setDate(startTime.getDate() - 30);
      break;
    default:
      startTime = new Date(0);
  }

  return {
    startTime: startTime.getTime(),
    endTime: lastTimestamp,
  };
};

export const calculateTotalDuration = (
  seriesData: SeriesDataPoint[],
  fixedSessionTypeSelected: boolean
): number => {
  if (seriesData.length === 0) return 0;
  const [first, last] = [seriesData[0], seriesData[seriesData.length - 1]];
  return fixedSessionTypeSelected
    ? (last as number[])[0] - (first as number[])[0]
    : (last as { x: number }).x - (first as { x: number }).x;
};
