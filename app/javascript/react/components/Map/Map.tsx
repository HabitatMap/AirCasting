import React, { useState } from "react";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";

import trees from "./trees";

import { containerStyle } from "./Map.style";
import { Markers } from "./Markers/Markers";
import { DEFAULT_ZOOM } from "../../const/coordinates";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const Map = () => {
  const mapConfigId = useSelector((state: RootState) => state.map.mapConfigId);
  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  return (
    <>
      <GoogleMap
        mapId={mapConfigId || null}
        mapTypeId={mapTypeId}
        defaultCenter={{ lat: 43.64, lng: -79.41 }}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling={"greedy"}
        disableDefaultUI
        scaleControl={true}
        style={containerStyle}
      >
        <Markers points={trees} />
      </GoogleMap>
    </>
  );
};

export { Map };
