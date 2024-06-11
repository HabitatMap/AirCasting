import { FixedStream } from "../../../types/fixedStream";
import { LatLngLiteral } from "../../../types/googleMaps";

type Point = LatLngLiteral & { streamId: string };

export type Session = {
  id: number;
  lastMeasurementValue: number;
  point: Point;
};

export type ListSession = {
  title: string;
  sensorName: string;
};
