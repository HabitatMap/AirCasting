import React from "react";
import { Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useSelector } from "react-redux";

import trees from "./trees";

import { containerStyle } from "./Map.style";
import { Markers } from "./Markers/Markers";
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../../const/coordinates";

import { RootState } from "../../store";
import mapStyles from "./mapStyles";

const Map = () => {
  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  const mapId = useSelector((state: RootState) => state.map.mapId);

  return (
    <>
      <GoogleMap
        mapId={mapId || null}
        mapTypeId={mapTypeId}
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        scaleControl={true}
        style={containerStyle}
        styles={mapStyles}
      >
        <Markers points={trees} />
      </GoogleMap>
    </>
  );
};

export { Map };
