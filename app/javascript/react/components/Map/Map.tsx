import React from "react";
import { useSelector } from "react-redux";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";

import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../../const/coordinates";
import { RootState } from "../../store";
import { containerStyle } from "./Map.style";
import mapStyles from "./mapStyles";
import { Markers } from "./Markers/Markers";
import trees from "./trees";

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
