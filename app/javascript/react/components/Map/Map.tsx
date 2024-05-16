import React, { useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, MarkerClusterer } from "@react-google-maps/api";

import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../../const/coordinates";
import { LocationSearch } from "../LocationSearch";
import { LatLngLiteral, Map, MapOptions } from "../../types/googleMaps";
import { MapElementsContainer, containerStyle } from "./Map.style";

const generatePoints = (position: LatLngLiteral) => {
  const _points: Array<LatLngLiteral> = [];
  for (let i = 0; i < 100; i++) {
    const direction = Math.random() < 0.5 ? -2 : 2;
    _points.push({
      lat: position.lat + Math.random() / direction,
      lng: position.lng + Math.random() / direction,
    });
  }
  return _points;
};

const Map = () => {
  const [location, setLocation] = useState<LatLngLiteral>(DEFAULT_MAP_CENTER);
  const mapRef = useRef<Map>();

  const onLoad = React.useCallback((map: Map) => {
    mapRef.current = map;
  }, []);

  const options: MapOptions = useMemo(() => {
    return {
      controlSize: 25,
      clickableIcons: false,
      fullscreenControl: false,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
    };
  }, []);

  const points = useMemo(
    () => generatePoints(DEFAULT_MAP_CENTER),
    [DEFAULT_MAP_CENTER]
  );

  return (
    <>
      <MapElementsContainer></MapElementsContainer>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={DEFAULT_ZOOM}
        center={DEFAULT_MAP_CENTER}
        onLoad={onLoad}
        options={options}
      >
        {location && (
          <Marker
            position={location}
            icon="https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
          />
        )}

        <MarkerClusterer>
          {(clusterer) =>
            points.map((point) => (
              <Marker
                key={point.lat}
                position={point}
                clusterer={clusterer}
                onClick={() => {
                  console.log(point);
                }}
              />
            ))
          }
        </MarkerClusterer>
      </GoogleMap>
    </>
  );
};

export { Map };
