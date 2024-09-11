import * as Highcharts from "highcharts";
import { LatLngLiteral } from "./googleMaps";

export type GraphData =
  | number[][]
  | { x: number | undefined; y: number; position: LatLngLiteral }[];

export type GraphPoint = {
  position: LatLngLiteral;
} & Highcharts.Point;
