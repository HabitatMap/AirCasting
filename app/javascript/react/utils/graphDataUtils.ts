import { Measurement } from "../store/fixedStreamSlice";

import { FixedMeasurement } from "../types/fixedStream";
import { LatLngLiteral } from "../types/googleMaps";
import { SeriesDataPoint } from "../types/graph";
import { Session } from "../types/sessionType";

export const createFixedSeriesData = (data: FixedMeasurement[]) =>
  (data || [])
    .map(({ time, value }: { time: number; value: number }) => [time, value])
    .sort((a, b) => a[0] - b[0]);

export const createMobileSeriesData = (
  data: Session[] | Measurement[],
  isGraphData: boolean
) =>
  data
    .map((measurement) => ({
      x: measurement.time,
      y:
        isGraphData && "lastMeasurementValue" in measurement
          ? measurement.lastMeasurementValue
          : (measurement as Measurement).value,
      position: {
        lat:
          isGraphData && "point" in measurement
            ? measurement.point.lat
            : (measurement as Measurement).latitude,
        lng:
          isGraphData && "point" in measurement
            ? measurement.point.lng
            : (measurement as Measurement).longitude,
      } as LatLngLiteral,
    }))
    .filter(
      (point): point is { x: number; y: number; position: LatLngLiteral } =>
        point.x !== undefined
    )
    .sort((a, b) => a.x - b.x);

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
