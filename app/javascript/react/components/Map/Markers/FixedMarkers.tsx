import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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
  defaultOnClusterClickHandler,
} from "@googlemaps/markerclusterer";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import { customRenderer, pulsatingRenderer } from "./ClusterConfiguration";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo"; // Import ClusterInfo component
import HoverMarker from "./HoverMarker/HoverMarker";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";
import type { LatLngLiteral } from "../../../types/googleMaps";
import { API_ENDPOINTS } from "../../../api/apiEndpoints";
import { oldApiClient } from "../../../api/apiClient";
import { selectHoverStreamId } from "../../../store/mapSlice";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

interface CustomMarkerClusterer extends MarkerClusterer {
  markerStreamIdMap?: Map<Marker, string>;
}

const FixedMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const map = useMap();

  const clusterer = useRef<CustomMarkerClusterer | null>(null);
  const markerRefs = useRef<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});
  const pulsatingClusterer = useRef<MarkerClusterer | null>(null);

  const thresholds = useSelector(selectThresholds);

  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.marker.AdvancedMarkerElement | null;
  }>({});

  const hoverStreamId = useSelector(selectHoverStreamId);
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );

  // State to track selected cluster
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  // Memoize the sessions and markers to avoid unnecessary re-renders
  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const memoizedMarkers = useMemo(() => markers, [markers]);

  // Initialize clusterer
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
        onClusterClick: handleClusterClick,
      }) as CustomMarkerClusterer;
    }
  }, [map, thresholds]);

  useEffect(() => {
    if (selectedStreamId) {
      const s = sessions.find(
        (session) => session?.point?.streamId === selectedStreamId?.toString()
      );
      if (s?.point) {
        centerMapOnMarker(s.point, s.point.streamId);
      }
    }
  }, [sessions]);

  const updateClusterer = useCallback(() => {
    if (clusterer.current && memoizedSessions.length > 0) {
      const sessionStreamIds = memoizedSessions.map(
        (session) => session.point.streamId
      );
      // Track clustered markers and their stream IDs
      const markerStreamIdMap = new Map<Marker, string>();

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
          markerStreamIdMap.set(marker, streamId);
        }
      });

      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(validMarkers);
      clusterer.current.markerStreamIdMap = markerStreamIdMap; // Store the map in clusterer
    }
  }, [memoizedSessions, memoizedMarkers]);

  // Update MarkerClusterer when markers and sessions change
  useEffect(() => {
    updateClusterer();
  }, [updateClusterer]);

  // Pulsation
  useEffect(() => {
    if (pulsatingSessionId) {
      const pulsatingSession = memoizedSessions.find(
        (session) => session.id === pulsatingSessionId
      );
      const pulsatingSessionStreamId = pulsatingSession?.point.streamId;
      if (pulsatingSessionStreamId && clusterer.current) {
        const pulsatingCluster: Cluster | undefined =
          //@ts-expect-error
          clusterer.current.clusters.find(
            (cluster: Cluster) =>
              cluster.markers &&
              cluster.markers.some(
                (clusterMarker: Marker) =>
                  clusterMarker === memoizedMarkers[pulsatingSessionStreamId]
              )
          );

        if (
          pulsatingCluster &&
          pulsatingCluster.markers &&
          pulsatingCluster.markers.length > 1
        ) {
          if (pulsatingClusterer.current) {
            pulsatingClusterer.current.clearMarkers();
          }
          pulsatingClusterer.current = new MarkerClusterer({
            map,
            renderer: pulsatingRenderer(thresholds, pulsatingCluster.position),
            markers: pulsatingCluster.markers,
            algorithm: new GridAlgorithm({ gridSize: 1000 }),
          });
        }
      }
    } else {
      if (pulsatingClusterer.current) {
        pulsatingClusterer.current.clearMarkers();
        pulsatingClusterer.current = null;
      }
    }
  }, [pulsatingSessionId, memoizedMarkers, memoizedSessions, thresholds]);

  // Cleanup clusters when component unmounts
  useEffect(() => {
    return () => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
      if (pulsatingClusterer.current) {
        pulsatingClusterer.current.clearMarkers();
      }
    };
  }, []);

  const centerMapOnMarker = useCallback(
    (position: LatLngLiteral, streamId: string) => {
      if (map && selectedStreamId) {
        map.setCenter(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    },
    [map, selectedStreamId]
  );

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
    if (hoverStreamId) {
      const hoveredSession = memoizedSessions.find(
        (session) => Number(session.point.streamId) === hoverStreamId
      );
      if (hoveredSession) {
        setHoverPosition(hoveredSession.point);
      }
    } else {
      setHoverPosition(null);
    }
  }, [hoverStreamId, memoizedSessions]);

  const handleClusterClick = useCallback(
    async (
      event: google.maps.MapMouseEvent,
      cluster: Cluster,
      map: google.maps.Map
    ) => {
      setSelectedCluster(cluster);
      const markerStreamIdMap = clusterer.current?.markerStreamIdMap;

      //@ts-expect-error
      const streamIds = cluster.markers
        .map((marker: Marker) => markerStreamIdMap?.get(marker))
        .filter((streamId) => streamId !== undefined);

      console.log("Stream IDs:", streamIds);
      // move cluster data to slice
      if (streamIds && streamIds.length > 0) {
        try {
          const response = await oldApiClient.get(
            API_ENDPOINTS.fetchClusterData(streamIds as string[])
          );
          console.log("Cluster data:", response.data);
        } catch (error) {
          console.error("Error fetching cluster data:", error);
        }
      }
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    if (map && selectedCluster) {
      defaultOnClusterClickHandler(
        { stop: () => {} } as google.maps.MapMouseEvent,
        selectedCluster,
        map
      );
    }
  }, [map, selectedCluster]);

  return (
    <>
      {memoizedSessions.map((session) => (
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
          onClick={(e) => console.log("clicked", e)}
        >
          <SessionFullMarker
            color={getColorForValue(thresholds, session.lastMeasurementValue)}
            value={`${Math.round(session.lastMeasurementValue)} µg/m³`}
            isSelected={session.point.streamId === selectedStreamId?.toString()}
            shouldPulse={session.id === pulsatingSessionId}
            onClick={() => {
              onMarkerClick(Number(session.point.streamId), Number(session.id));
              centerMapOnMarker(session.point, session.point.streamId);
            }}
          />
        </AdvancedMarker>
      ))}
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {selectedCluster && (
        <ClusterInfo
          color={getColorForValue(thresholds, 33)} // Replace with actual color logic
          value={`${selectedCluster.markers?.length} markers`}
          handleZoomIn={handleZoomIn}
        />
      )}
    </>
  );
};

export { FixedMarkers };
