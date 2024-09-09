import { LatLngLiteral } from "../types/googleMaps";

export const createFixedSeriesData = (data: any[]) =>
  (data || [])
    .map(({ time, value }: { time: number; value: number }) => [time, value])
    .sort((a, b) => a[0] - b[0]);

export const createMobileSeriesData = (data: any[], isGraphData: boolean) =>
  data
    .map((measurement) => ({
      x: measurement.time,
      y: isGraphData ? measurement.lastMeasurementValue : measurement.value,
      position: {
        lat: isGraphData ? measurement.point.lat : measurement.latitude,
        lng: isGraphData ? measurement.point.lng : measurement.longitude,
      } as LatLngLiteral,
    }))
    .filter((point) => point.x !== undefined)
    .sort((a, b) => a.x - b.x);
