import React, { useState } from "react";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";

import trees from "./trees";

import { containerStyle } from "./Map.style";
import { Markers } from "./Markers";
import { ControlPanel } from "./ControlPanel/ControlPanel";

const MapTypeId = {
  HYBRID: "hybrid",
  ROADMAP: "roadmap",
  SATELLITE: "satellite",
  TERRAIN: "terrain",
};
export type MapConfig = {
  id: string;
  label: string;
  mapId?: string;
  mapTypeId?: string;
  styles?: google.maps.MapTypeStyle[];
};

const MAP_CONFIGS: MapConfig[] = [
  {
    id: "light",
    label: "Light",
    mapId: "49ae42fed52588c3",
    mapTypeId: MapTypeId.ROADMAP,
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
];

const Map = () => {
  const [mapConfig, setMapConfig] = useState<MapConfig>(MAP_CONFIGS[0]);
  return (
    // <GoogleMap
    //   zoom={DEFAULT_ZOOM}
    //   center={DEFAULT_MAP_CENTER}
    //   style={containerStyle}

    // >
    <>
      <GoogleMap
        mapId={mapConfig.mapId || null}
        mapTypeId={mapConfig.mapTypeId}
        defaultCenter={{ lat: 43.64, lng: -79.41 }}
        defaultZoom={10}
        gestureHandling={"greedy"}
        disableDefaultUI
        scaleControl={true}
        style={containerStyle}
      >
        <Markers points={trees} />
      </GoogleMap>
      <ControlPanel
        mapConfigs={MAP_CONFIGS}
        mapConfigId={mapConfig.id}
        onMapConfigIdChange={(id) =>
          setMapConfig(MAP_CONFIGS.find((s) => s.id === id)!)
        }
      />
    </>
  );
};

export { Map };
