import { FixedMeasurement } from "../types/fixedStream";
import { LatLngLiteral } from "../types/googleMaps";
import { Session } from "../types/sessionType";

import { Measurement } from "../store/fixedStreamSlice";

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
