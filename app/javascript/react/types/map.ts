const MapTypeId = {
  ROADMAP: "roadmap",
  SATELLITE: "satellite",
  TERRAIN: "terrain",
  HYBRID: "hybrid",
};

enum ViewMode {
  MAP = "map",
  SATELLITE = "satellite",
  TERRAIN = "terrain",
  LABELS = "labels",
}

type MapConfig = {
  id: string;
  label: string;
  mapId?: string;
  mapTypeId: string;
  styles?: google.maps.MapTypeStyle[];
};

type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export { MapTypeId, ViewMode, MapConfig, MapBounds };
