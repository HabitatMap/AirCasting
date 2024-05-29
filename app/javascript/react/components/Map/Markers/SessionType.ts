import { LatLngLiteral } from "../../../types/googleMaps";

type Point = LatLngLiteral & { key: string };

export type Session = {
  id: number;
  lastMeasurementValue: number;
  point: Point;
};
