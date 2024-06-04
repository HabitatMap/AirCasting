import { MapConfig, MapTypeId } from "../../types/map";
import mapStyles from "./mapStyles";


export const MAP_CONFIGS: MapConfig[] = [
  {
    id: "map",
    label: "Map",
    mapTypeId: MapTypeId.ROADMAP,
    mapId: "3808fe50f232092d",
    styles: mapStyles,
  },

  {
    id: "satellite",
    label: "Satellite",
    mapTypeId: MapTypeId.SATELLITE,
  },
  {
    id: "terrain",
    label: "Terrain",
    mapTypeId: MapTypeId.TERRAIN,
  },
  {
    id: "labels",
    label: "Labels",
    mapTypeId: MapTypeId.HYBRID,
  },
];

export const MAP_ID = "3d00eebfde3a81b9";
