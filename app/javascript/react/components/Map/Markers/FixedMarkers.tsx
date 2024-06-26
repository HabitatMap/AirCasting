import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Cluster,
  GridAlgorithm,
  Marker,
  MarkerClusterer,
} from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { Session } from "../../../types/sessionType";
import { pubSub } from "../../../utils/pubSubManager";
import { customRenderer, pulsatingRenderer } from "./ClusterConfiguration";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

import type { LatLngLiteral } from "../../../types/googleMaps";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const FixedMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [streamId: string]: Marker | null }>(
    {}
  );
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );
  const ZOOM_FOR_SELECTED_SESSION = 15;
  const clusterer = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<{ [streamId: string]: Marker | null }>({});

  useEffect(() => {
    if (map && !clusterer.current) {
      clusterer.current = new MarkerClusterer({
        map,
        renderer: customRenderer,
      });
    }
  }, [map, sessions]);

  useEffect(() => {
    const handleData = (id: number) => {
      const s = sessions.find((session) => {
        return session.id === id;
      });

      if (s?.point) {
        centerMapOnMarker(s.point, s.point.streamId);
      }
    };

    pubSub.subscribe("CENTER_MAP", handleData);

    return () => {
      pubSub.unsubscribe("CENTER_MAP", handleData);
    };
  }, [sessions]);

  // Update MarkerClusterer when markers and sessions change
  useEffect(() => {
    if (clusterer.current) {
      const sessionStreamIds = sessions.map(
        (session) => session.point.streamId
      );
      Object.keys(markers).forEach((key) => {
        if (!sessionStreamIds.includes(key)) {
          delete markers[key];
        }
      });
      const validMarkers = Object.values(markers).filter(
        (marker): marker is Marker => marker !== null
      );
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(validMarkers);
    }
  }, [markers, sessions]);

  const pulsatingClusterer = useRef<MarkerClusterer | null>(null);

  // pulsation
  useEffect(() => {
    if (pulsatingSessionId) {
      const pulsatingSession = sessions.find(
        (session) => session.id === pulsatingSessionId
      );
      const pulsatingSessionStreamId = pulsatingSession?.point.streamId;

      Object.keys(markers).forEach((key) => {
        if (clusterer.current && pulsatingSessionStreamId === key) {
          const pulsatingCluster: Cluster | undefined =
            // @ts-ignore:next-line
            clusterer.current.clusters.find((cluster: any) =>
              cluster.markers.some(
                (clusterMarker: any) => clusterMarker === markers[key]
              )
            );

          if (pulsatingClusterer.current) {
            pulsatingClusterer.current.clearMarkers();
          }
          pulsatingClusterer.current = new MarkerClusterer({
            map,
            renderer: pulsatingRenderer(pulsatingCluster?.position),
            markers: pulsatingCluster?.markers,
            algorithm: new GridAlgorithm({ gridSize: 1000 }),
          });
        }
      });
    } else {
      if (
        pulsatingClusterer.current &&
        // @ts-ignore:next-line
        pulsatingClusterer.current.markers.length > 1
      ) {
        pulsatingClusterer.current.clearMarkers();
      }
    }
  }, [pulsatingSessionId]);

  // Cleanup clusters when component unmounts
  useEffect(() => {
    return () => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
    };
  }, []);

  const centerMapOnMarker = (position: LatLngLiteral, streamId: string) => {
    if (map) {
      map.setCenter(position);
      map.setZoom(ZOOM_FOR_SELECTED_SESSION);
    }
    setSelectedMarkerKey(streamId === selectedMarkerKey ? null : streamId);
  };

  useEffect(() => {
    if (selectedStreamId === null) {
      setSelectedMarkerKey(null);
    }
  }, [selectedStreamId]);

  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
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
  }, []);

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
          ref={(marker) => {
            if (marker && clusterer.current) {
              setMarkerRef(marker, session.point.streamId);
              clusterer.current.addMarker(marker);
            }
          }}
        >
          <SessionFullMarker
            color="#E95F5F"
            value={`${Math.round(session.lastMeasurementValue)} µg/m³`}
            isSelected={session.point.streamId === selectedMarkerKey}
            shouldPulse={session.id === pulsatingSessionId}
            onClick={() => {
              onMarkerClick(Number(session.point.streamId), Number(session.id));
              centerMapOnMarker(session.point, session.point.streamId);
            }}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { FixedMarkers };
