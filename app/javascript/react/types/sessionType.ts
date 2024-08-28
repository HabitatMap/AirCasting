import { LatLngLiteral } from "./googleMaps";

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

export type IndoorSession = Omit<Session, "point">;

export type SessionList = {
  id: number;
  title: string;
  sensorName: string;
  averageValue: number;
  startTime: string;
  endTime: string;
  streamId: number;
};
