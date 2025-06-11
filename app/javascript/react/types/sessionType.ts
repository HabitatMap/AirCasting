import { LatLngLiteral } from "./googleMaps";
import { Note } from "./note";

export type Point = LatLngLiteral & {
  maxLatitude?: number;
  maxLongitude?: number;
  minLatitude?: number;
  minLongitude?: number;
  streamId: string;
};

export type FixedSession = {
  id: number;
  averageValue: number | null;
  lastMeasurementValue: number;
  point: Point;
  time?: number;
};

export type MobileSession = {
  id: number;
  lastMeasurementValue: number;
  point: Point;
  time?: number;
  notes?: Note[];
};

export type IndoorSession = Omit<FixedSession, "point">;

export type SessionList = {
  id: number;
  title: string;
  sensorName: string;
  averageValue: number | null;
  startTime: string;
  endTime: string;
  streamId: number;
};
