import React, { useEffect } from "react";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";

import mapStyles from "./mapStyles";
import trees from "./trees";

import { containerStyle } from "./Map.style";
import { Markers } from "./Markers/Markers";
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../../const/coordinates";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { fetchSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";

const Map = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("Starting fetching sessions");
    dispatch(fetchSessions({ test: "test" }));
  }, []);

  const mapTypeId = useSelector((state: RootState) => state.map.mapTypeId);
  const mapId = useSelector((state: RootState) => state.map.mapId);

  return (
    <>
      <GoogleMap
        mapId={mapId || null}
        mapTypeId={mapTypeId}
        // defaultCenter={DEFAULT_MAP_CENTER}
        defaultCenter={{ lat: 43.64, lng: -79.41 }}
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
