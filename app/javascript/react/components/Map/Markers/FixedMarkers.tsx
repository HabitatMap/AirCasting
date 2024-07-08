import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";

import {
  Cluster,
  GridAlgorithm,
  Marker,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { selectHoverStreamId } from "../../../store/mapSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { pubSub } from "../../../utils/pubSubManager";
import { getColorForValue } from "../../../utils/thresholdColors";
import { customRenderer, pulsatingRenderer } from "./ClusterConfiguration";
import HoverMarker from "./HoverMarker/HoverMarker";
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
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const map = useMap();

  const clusterer = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});
  const pulsatingClusterer = useRef<MarkerClusterer | null>(null);

  const thresholds = useSelector(selectThresholds);

  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(
    null
  );

  const hoverStreamId = useSelector(selectHoverStreamId);
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );

  useLayoutEffect(() => {
    if (map) {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
      clusterer.current = new MarkerClusterer({
        map,
        renderer: customRenderer(thresholds),
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 21,
          radius: 40,
        }),
      });
    }
  }, [map, sessions, thresholds]);

  useEffect(() => {
    if (selectedStreamId === null) {
      setSelectedMarkerKey(null);
    }
  }, [selectedStreamId]);

  useEffect(() => {
    const handleData = (id: number) => {
      const s = sessions.find((session) => session.id === id);

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
    if (clusterer.current && sessions.length > 0) {
      const sessionStreamIds = sessions.map(
        (session) => session.point.streamId
      );
      Object.keys(markers).forEach((key) => {
        if (!sessionStreamIds.includes(key)) {
          delete markers[key];
        }
      });
      const validMarkers = Object.values(markers).filter(
        (marker): marker is google.maps.marker.AdvancedMarkerElement =>
          marker !== null
      );
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(validMarkers);
    }
  }, [markers, sessions, thresholds]);

  // Pulsation
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
            clusterer.current.clusters.find((cluster: Cluster) =>
              cluster.markers && cluster.markers.some(
                (clusterMarker: Marker) => clusterMarker === markers[key]
              )
            );

          if (
            pulsatingClusterer.current &&
            // @ts-ignore:next-line
            pulsatingClusterer.current.markers.length > 1
          ) {
            pulsatingClusterer.current.clearMarkers();
          }
          pulsatingClusterer.current = new MarkerClusterer({
            map,
            renderer: pulsatingRenderer(thresholds, pulsatingCluster?.position),
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

  useEffect(() => {
    // If hoverStreamId is set, update hoverPosition only if it's not null
    if (hoverStreamId) {
      const hoveredSession = sessions.find(
        (session) => Number(session.point.streamId) === hoverStreamId
      );
      if (hoveredSession) {
        setHoverPosition(hoveredSession.point);
      }
    } else {
      setHoverPosition(null);
    }
  }, [hoverStreamId, sessions]);

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          position={session.point}
          key={session.point.streamId}
          zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
          title={session.lastMeasurementValue.toString()}
          ref={(marker) => {
            if (marker && clusterer.current) {
              setMarkerRef(marker, session.point.streamId);
              clusterer.current.addMarker(marker);
            }
          }}
        >
          <SessionFullMarker
            color={getColorForValue(thresholds, session.lastMeasurementValue)}
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
      {/* Keep hoverPosition state but don't use it to render markers */}
    </>
  );
};

export { FixedMarkers };
