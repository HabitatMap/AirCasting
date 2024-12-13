import { Cluster } from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterInfo, ClusterInfoLoading } from "./ClusterInfo/ClusterInfo";

import HoverMarker from "./HoverMarker/HoverMarker";

import useScreenSizeDetection from "../../../utils/useScreenSizeDetection";
import { ClusterOverlay } from "./ClusterMarker/clusterOverlay";
import { CustomMarkerClusterer } from "./ClusterMarker/CustomMarkerClusterer";
import { LabelOverlay } from "./CustomOverlays/customMarkerLabel";
import { CustomMarkerOverlay } from "./CustomOverlays/customMarkerOverlay";
import { CustomAlgorithm } from "./gridClusterAlgorithm";

type CustomMarker = google.maps.Marker & {
  value: number;
  sessionId: number;
  userData: { streamId: string };
  clustered: boolean;
};

export type CustomCluster = Cluster & {
  id: string;
};

type FixedMarkersProps = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
  onClusterClick?: (clusterData: Cluster) => void;
};

interface CustomRendererProps {
  position: google.maps.LatLng | google.maps.LatLngLiteral;
}

const ZOOM_FOR_SELECTED_SESSION = 15;

export function FixedMarkers({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
  onClusterClick,
}: FixedMarkersProps) {
  const dispatch = useAppDispatch();
  const { unitSymbol, currentUserSettings } = useMapParams();
  const map = useMap();

  // Redux selectors
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const clusterData = useAppSelector((state) => state.cluster.data);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);

  // Refs
  const clustererRef = useRef<CustomMarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());
  const markerOverlays = useRef<Map<string, CustomMarkerOverlay>>(new Map());
  const labelOverlays = useRef<Map<string, LabelOverlay>>(new Map());
  const clusterOverlaysRef = useRef<Map<string, ClusterOverlay>>(new Map());
  const previousZoomRef = useRef<number | null>(null);
  const previousModeRef = useRef<string | null>(null);
  const isMobile = useScreenSizeDetection();

  // State variables
  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [clusterDataLoading, setClusterDataLoading] = useState<boolean>(false);

  // Memoized values
  const memoizedSessions = useMemo(() => sessions, [sessions]);

  // Refs for event handlers
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Utility functions

  const centerMapOnMarker = useCallback(
    (position: LatLngLiteral) => {
      if (map) {
        map.panTo(position);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    },
    [map]
  );

  const handleClusterClickInternal = useCallback(
    async (event: google.maps.MapMouseEvent, cluster: CustomCluster) => {
      dispatch(setVisibility(false));
      if (map) {
        const pixelPosition = getClusterPixelPosition(map, cluster.position);
        setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      }
      setClusterDataLoading(true);
      setSelectedCluster(cluster);

      const markerStreamIds = cluster.markers
        ?.map((marker) => (marker as CustomMarker).userData?.streamId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (markerStreamIds && markerStreamIds.length > 0) {
        await dispatch(fetchClusterData(markerStreamIds));
      }
      setClusterDataLoading(false);
      dispatch(setVisibility(true));
      onClusterClick?.(cluster);
    },
    [dispatch, map, onClusterClick]
  );

  const handleClusteringEnd = useCallback(() => {
    if (!map || !clustererRef.current) return;

    // Clear existing cluster overlays
    clusterOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    clusterOverlaysRef.current.clear();

    // Reset clustering state for all markers
    markerRefs.current.forEach((marker) => {
      marker.clustered = false;
    });
    // Get current clusters
    const clusters = clustererRef.current.getClusters() as CustomCluster[];

    // Process each cluster
    clusters.forEach((cluster) => {
      if (cluster.markers && cluster.markers.length > 1) {
        // Mark markers as clustered
        cluster.markers.forEach((marker) => {
          (marker as CustomMarker).clustered = true;
        });

        // Calculate average value for cluster
        const markers = cluster.markers as CustomMarker[];
        const values = markers.map((marker) => marker.value || 0);
        const average =
          values.reduce((sum, value) => sum + value, 0) / values.length;

        // Get color based on average value
        const color = getColorForValue(thresholds, average);

        // Check if cluster contains pulsating session
        const hasPulsatingSession =
          pulsatingSessionId !== null &&
          markers.some((marker) => marker.sessionId === pulsatingSessionId);

        // Create cluster overlay
        const overlay = new ClusterOverlay(
          cluster,
          color,
          hasPulsatingSession,
          map,
          handleClusterClickInternal
        );

        // Store cluster overlay
        const clusterKey = `${cluster.position
          .lat()
          .toFixed(6)}_${cluster.position.lng().toFixed(6)}`;
        clusterOverlaysRef.current.set(clusterKey, overlay);
      }
    });
  }, [map, thresholds, pulsatingSessionId, handleClusterClickInternal]);

  const customRenderer = {
    render: ({ position }: CustomRendererProps) => {
      return new google.maps.Marker({
        position,
        visible: false,
      });
    },
  };

  const createMarker = useCallback(
    (session: Session): CustomMarker => {
      const marker = new google.maps.Marker({
        position: session.point,
        icon: {
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1,
      }) as CustomMarker;

      marker.value = session.lastMeasurementValue;
      marker.sessionId = session.id;
      marker.userData = { streamId: session.point.streamId };
      marker.clustered = false;

      marker.addListener("click", () => {
        onMarkerClickRef.current(
          Number(session.point.streamId),
          Number(session.id)
        );
        centerMapOnMarker(session.point);
      });

      return marker;
    },
    [centerMapOnMarker]
  );

  const handleMapInteraction = useCallback(() => {
    dispatch(setVisibility(false));
    setSelectedCluster(null);
    setClusterPosition(null);
  }, [dispatch]);

  const handleBoundsChanged = useCallback(() => {
    if (selectedCluster && map) {
      const pixelPosition = getClusterPixelPosition(
        map,
        selectedCluster.position
      );
      setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
    }
  }, [map, selectedCluster]);

  useMapEventListeners(map, {
    click: handleMapInteraction,
    touchend: handleMapInteraction,
    dragstart: handleMapInteraction,
    bounds_changed: handleBoundsChanged,
  });

  const handleZoomIn = useCallback(() => {
    if (map && selectedCluster) {
      const bounds = new google.maps.LatLngBounds();
      selectedCluster.markers?.forEach((marker) => {
        const position =
          "getPosition" in marker ? marker.getPosition() : marker.position;
        if (position) {
          bounds.extend(position);
        }
      });

      map.fitBounds(bounds);
      map.panToBounds(bounds);

      google.maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined) {
          map.setZoom(Math.max(currentZoom - 1, 0));
        }
      });

      handleMapInteraction();
      setSelectedCluster(null);
      dispatch(setVisibility(false));
    }
  }, [map, selectedCluster, handleMapInteraction, dispatch]);

  const updateClusterOverlays = useCallback(() => {
    clusterOverlaysRef.current.forEach((overlay) => {
      const cluster = overlay.cluster;
      const markers = cluster.markers as CustomMarker[];
      const hasPulsatingSession =
        pulsatingSessionId !== null &&
        markers.some((marker) => marker.sessionId === pulsatingSessionId);

      overlay.setShouldPulse(hasPulsatingSession);
    });
  }, [pulsatingSessionId]);

  const updateMarkerOverlays = useCallback(() => {
    markerRefs.current.forEach((marker, streamId) => {
      const isSelected =
        marker.userData?.streamId === selectedStreamId?.toString();
      const shouldPulse =
        marker.sessionId === pulsatingSessionId && !marker.clustered;
      const newColor = getColorForValue(thresholds, marker.value);
      const existingOverlay = markerOverlays.current.get(streamId);
      const existingLabelOverlay = labelOverlays.current.get(streamId);
      const position = marker.getPosition();

      // Remove overlays if marker is clustered
      if (marker.clustered) {
        if (existingOverlay) {
          existingOverlay.setMap(null);
          markerOverlays.current.delete(streamId);
        }
        if (existingLabelOverlay) {
          existingLabelOverlay.setMap(null);
          labelOverlays.current.delete(streamId);
        }
      } else {
        // Ensure overlays are present and updated
        if (!existingOverlay) {
          const overlay = new CustomMarkerOverlay(
            position!,
            newColor,
            isSelected,
            shouldPulse
          );
          overlay.setMap(map);
          markerOverlays.current.set(streamId, overlay);
        } else {
          existingOverlay.setIsSelected(isSelected);
          existingOverlay.setShouldPulse(shouldPulse);
          existingOverlay.setColor(newColor);
          existingOverlay.update();
        }

        if (!existingLabelOverlay) {
          const labelOverlay = new LabelOverlay(
            position!,
            newColor,
            marker.value,
            unitSymbol,
            isSelected,
            () => {
              onMarkerClickRef.current(
                Number(marker.userData.streamId),
                Number(marker.sessionId)
              );
              if (position) {
                centerMapOnMarker({ lat: position.lat(), lng: position.lng() });
              }
            }
          );
          labelOverlay.setMap(map);
          labelOverlays.current.set(streamId, labelOverlay);
        } else {
          existingLabelOverlay.update(
            isSelected,
            newColor,
            marker.value,
            unitSymbol
          );
        }
      }
    });
  }, [
    map,
    selectedStreamId,
    pulsatingSessionId,
    thresholds,
    unitSymbol,
    centerMapOnMarker,
  ]);

  // Add cleanup function
  const clearAllMarkersAndClusters = useCallback(() => {
    // Clear clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.setMap(null);
      clustererRef.current = null;
    }

    // Clear all marker overlays
    markerOverlays.current.forEach((overlay) => {
      overlay.setMap(null);
    });
    markerOverlays.current.clear();

    // Clear all label overlays
    labelOverlays.current.forEach((overlay) => {
      overlay.setMap(null);
    });
    labelOverlays.current.clear();

    // Clear all cluster overlays
    clusterOverlaysRef.current.forEach((overlay) => {
      overlay.setMap(null);
    });
    clusterOverlaysRef.current.clear();

    // Clear all markers
    markerRefs.current.forEach((marker) => {
      marker.setMap(null);
    });
    markerRefs.current.clear();

    // Reset state
    setSelectedCluster(null);
    setClusterPosition(null);
    setHoverPosition(null);
  }, []);

  // Single effect to handle all marker/cluster updates
  useEffect(() => {
    if (!map) return;

    // Always clear everything first
    clearAllMarkersAndClusters();

    // Initialize clusterer if needed
    if (!clustererRef.current) {
      const algorithm = new CustomAlgorithm();
      clustererRef.current = new CustomMarkerClusterer({
        map,
        markers: [],
        renderer: customRenderer,
        algorithm,
      });
    }

    // Add clustering end listener
    const listener = clustererRef.current.addListener(
      "clusteringend",
      handleClusteringEnd
    );

    // Filter sessions based on selectedStreamId
    const filteredSessions = selectedStreamId
      ? sessions.filter(
          (session) => Number(session.point.streamId) === selectedStreamId
        )
      : sessions;

    // Create new markers if we have sessions
    if (filteredSessions.length > 0) {
      const markers = filteredSessions.map((session) => {
        const marker = createMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
        return marker;
      });

      clustererRef.current.addMarkers(markers);
      clustererRef.current.render();
      updateMarkerOverlays();
    }

    // Update loading state
    dispatch(
      setMarkersLoading(markerRefs.current.size < filteredSessions.length)
    );

    // Cleanup
    return () => {
      listener?.remove();
      clearAllMarkersAndClusters();
    };
  }, [
    sessions,
    selectedStreamId,
    map,
    currentUserSettings,
    createMarker,
    handleClusteringEnd,
    updateMarkerOverlays,
    clearAllMarkersAndClusters,
    customRenderer,
    dispatch,
  ]);

  // Keep only the hover effect
  useEffect(() => {
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

  // Add effect to handle zooming to selected marker
  useEffect(() => {
    if (selectedStreamId && map) {
      const selectedSession = sessions.find(
        (session) => Number(session.point.streamId) === selectedStreamId
      );

      if (selectedSession) {
        map.panTo(selectedSession.point);
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      }
    }
  }, [selectedStreamId, sessions, map]);

  return (
    <>
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {clusterPosition &&
        selectedCluster &&
        (clusterDataLoading ? (
          <ClusterInfoLoading position={clusterPosition} visible={true} />
        ) : (
          clusterData && (
            <ClusterInfo
              color={getColorForValue(thresholds, clusterData.average)}
              average={clusterData.average}
              numberOfSessions={clusterData.numberOfInstruments}
              handleZoomIn={handleZoomIn}
              position={clusterPosition}
              visible={clusterVisible}
            />
          )
        ))}
    </>
  );
}
