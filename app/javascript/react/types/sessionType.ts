import { LatLngLiteral } from "./googleMaps";
import { Note } from "./note";

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
  notes?: Note[];
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
  lastMeasurementValue?: number;
};
