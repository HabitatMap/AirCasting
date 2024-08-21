import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { customRenderer } from "./ClusterConfiguration";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

type Props = {
  sessions: {
    streamId: number;
    value: number;
    latitude: number;
    longitude: number;
  }[];
};

interface CustomMarkerClusterer extends MarkerClusterer {
  markerStreamIdMap?: Map<google.maps.marker.AdvancedMarkerElement, number>;
}

const TimelapseMarkers = ({ sessions }: Props) => {
  const map = useMap();
  const clusterer = useRef<CustomMarkerClusterer | null>(null);
  const markerRefs = useRef<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});

  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});

  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const memoizedMarkers = useMemo(() => markers, [markers]);

  // Initialize or update clusterer without clearing markers
  if (map && !clusterer.current) {
    clusterer.current = new MarkerClusterer({
      map,
      renderer: customRenderer(thresholds),
      algorithm: new SuperClusterAlgorithm({
        maxZoom: 21,
        radius: 40,
      }),
    }) as CustomMarkerClusterer;
  }

  // Update clusters with new markers
  const updateClusterer = useCallback(() => {
    if (clusterer.current && memoizedSessions.length > 0) {
      const sessionStreamIds = memoizedSessions.map((session) =>
        session.streamId.toString()
      );
      const markerStreamIdMap = new Map<
        google.maps.marker.AdvancedMarkerElement,
        number
      >();

      Object.keys(memoizedMarkers).forEach((key) => {
        if (!sessionStreamIds.includes(key)) {
          delete memoizedMarkers[key];
        }
      });

      const validMarkers = Object.values(memoizedMarkers).filter(
        (marker): marker is google.maps.marker.AdvancedMarkerElement =>
          marker !== null
      );

      validMarkers.forEach((marker) => {
        const streamId = sessionStreamIds.find(
          (id) => memoizedMarkers[id] === marker
        );
        if (streamId) {
          markerStreamIdMap.set(marker, Number(streamId));
        }
      });

      clusterer.current?.addMarkers(validMarkers);
      clusterer.current.markerStreamIdMap = markerStreamIdMap;
    }
  }, [memoizedSessions, memoizedMarkers]);

  updateClusterer();

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
      if (markerRefs.current[key] === marker) return;

      markerRefs.current[key] = marker;
      setMarkers((prev) => {
        if (marker) {
          return { ...prev, [key]: marker };
        } else {
          const newMarkers = { ...prev };
          delete newMarkers[key];
          return newMarkers;
        }
      });
    },
    []
  );

  return (
    <>
      {memoizedSessions.map((session) => (
        <AdvancedMarker
          position={{
            lat: session.latitude,
            lng: session.longitude,
          }}
          key={session.streamId}
          zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
          title={session.value.toString()}
          ref={(marker) => {
            if (marker && clusterer.current) {
              setMarkerRef(marker, session.streamId.toString());
              clusterer.current.addMarker(marker);
            }
          }}
        >
          <SessionFullMarker
            color={getColorForValue(thresholds, session.value)}
            value={`${Math.round(session.value)} ${unitSymbol}`}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { TimelapseMarkers };
