// utils/createGraphData.ts

import { Measurement } from "../store/fixedStreamSlice";
import { LatLngLiteral } from "../types/googleMaps";
import { Session } from "../types/sessionType";

export const createFixedSeriesData = (
  measurements: Measurement[] | undefined
) =>
  measurements
    ?.map(({ time, value }) => [time, value] as [number, number])
    .sort((a, b) => a[0] - b[0]); // Ensure ascending order

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
    .sort((a, b) => a.x - b.x); // Ensure ascending order
