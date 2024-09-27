import {
  Cluster,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { Marker, useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";

import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import type { LatLngLiteral } from "../../../types/googleMaps";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";
import { createMarkerIcon } from "./createMarkerIcon";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

interface CustomMarkerClusterer extends MarkerClusterer {
  markerStreamIdMap?: Map<google.maps.Marker, string>;
}

const FixedMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: Props) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const map = useMap();
  const { unitSymbol } = useMapParams();
  const clusterData = useAppSelector((state) => state.cluster.data);
  const clusterLoading = useAppSelector((state) => state.cluster.loading);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  const clusterer = useRef<CustomMarkerClusterer | null>(null);
  const markerRefs = useRef<{
    [streamId: string]: google.maps.Marker | null;
  }>({});

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [markers, setMarkers] = useState<{
    [streamId: string]: google.maps.Marker | null;
  }>({});
  const [visibleMarkers, setVisibleMarkers] = useState<Set<string>>(new Set());
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const memoizedMarkers = useMemo(() => markers, [markers]);

  const markersCount = Object.values(markers).filter(
    (marker) => marker !== null
  ).length;

  const centerMapOnMarker = useCallback(
    (position: LatLngLiteral) => {
      if (map && position) {
        map.panTo(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    },
    [map]
  );

  const setMarkerRef = useCallback(
    (marker: google.maps.Marker | null, key: string) => {
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

  // Handle cluster clicks and display cluster info
  const handleClusterClick = useCallback(
    async (
      event: google.maps.MapMouseEvent,
      cluster: Cluster,
      map: google.maps.Map
    ) => {
      dispatch(setVisibility(false));

      const markerStreamIds =
        cluster.markers?.map((marker) => marker.title || "") ?? [];
      if (markerStreamIds.length > 0) {
        dispatch(fetchClusterData(markerStreamIds as string[]));
      }

      const pixelPosition = getClusterPixelPosition(map, cluster.position);
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      setSelectedCluster(cluster);
      dispatch(setVisibility(true));
    },
    [dispatch]
  );

  useEffect(() => {
    if (selectedStreamId) {
      setVisibleMarkers(new Set([`marker-${selectedStreamId}`]));
    } else {
      setVisibleMarkers(
        new Set(
          memoizedSessions.map((session) => `marker-${session.point.streamId}`)
        )
      );
    }
  }, [selectedStreamId, memoizedSessions]);

  useEffect(() => {
    return () => {
      if (markerRefs.current) {
        Object.values(markerRefs.current).forEach((marker) => {
          marker?.setMap(null);
        });
      }
    };
  }, []);

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

  useEffect(() => {
    if (markersCount >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, markersCount, sessions.length]);

  // Initialize the MarkerClusterer with custom renderer
  useEffect(() => {
    if (map && memoizedSessions.length > 0) {
      if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({
          map,
          algorithm: new SuperClusterAlgorithm({ maxZoom: 21, radius: 40 }),
        });

        // Add cluster click event listener
        clusterer.current.addListener(
          "clusterclick",
          (event: google.maps.MapMouseEvent, cluster: Cluster) => {
            handleClusterClick(event, cluster, map);
          }
        );
      }

      if (clusterer.current) {
        const markerArray = Object.values(memoizedMarkers).filter(
          (marker): marker is google.maps.Marker => marker !== null
        );

        clusterer.current.clearMarkers();

        if (markerArray.length > 0) {
          clusterer.current.addMarkers(markerArray);
        }
      }
    }

    return () => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
    };
  }, [map, memoizedSessions, memoizedMarkers, handleClusterClick]);

  return (
    <>
      {memoizedSessions.map((session) => (
        <Marker
          position={session.point}
          key={session.point.streamId}
          icon={createMarkerIcon(
            getColorForValue(thresholds, session.lastMeasurementValue),
            `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
            session.point.streamId === selectedStreamId?.toString(),
            session.id === pulsatingSessionId
          )}
          ref={(marker) => {
            if (marker) {
              setMarkerRef(marker, session.point.streamId);
            }
          }}
          onClick={() => {
            onMarkerClick(Number(session.point.streamId), Number(session.id));
            centerMapOnMarker(session.point);
          }}
        />
      ))}
      {hoverPosition && <HoverMarker position={hoverPosition} />}

      {/* Cluster Info display */}
      {selectedCluster && clusterPosition && !clusterLoading && clusterData && (
        <ClusterInfo
          color={getColorForValue(thresholds, clusterData.average)}
          average={clusterData.average}
          numberOfSessions={clusterData.numberOfInstruments}
          handleZoomIn={() => {
            const currentZoom = map?.getZoom();
            if (currentZoom && map) {
              map.setZoom(currentZoom + 1);
              map.panTo(selectedCluster.position);
            }
          }}
          position={clusterPosition}
          visible={clusterVisible}
        />
      )}
    </>
  );
};

export { FixedMarkers };
