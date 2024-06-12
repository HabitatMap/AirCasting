import { LatLngLiteral } from "../../../types/googleMaps";

export type Point = LatLngLiteral & {
  maxLatitude?: number;
  maxLongitude?: number;
  minLatitude?: number;
  minLongitude?: number;
  streamId: string;
};

export type Session = {
  id: number;
  lastMeasurementValue: number;
  point: Point;
  time?: number;
};
