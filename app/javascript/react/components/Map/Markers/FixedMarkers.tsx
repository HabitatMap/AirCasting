import {
  Cluster,
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { Thresholds } from "../../../types/thresholds";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { createFixedMarkersRenderer } from "./ClusterConfiguration";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import { createClusterIcon } from "./createMarkerIcon";
import HoverMarker from "./HoverMarker/HoverMarker";
import { CustomMarkerOverlay } from "./customMarkerOverlay";
import { LabelOverlay } from "./customMarkerLabel";

type CustomMarker = google.maps.Marker & {
  value: number;
  sessionId: number;
  userData: { streamId: string };
  clustered: boolean; // New property
};

type FixedMarkersProps = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
  onClusterClick?: (clusterData: Cluster) => void;
};

const ZOOM_FOR_SELECTED_SESSION = 15;
const CLUSTER_RADIUS = 40;

export function FixedMarkers({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
  onClusterClick,
}: FixedMarkersProps) {
  const dispatch = useAppDispatch();
  const map = useMap();
  const { unitSymbol } = useMapParams();

  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const clusterData = useAppSelector((state) => state.cluster.data);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());
  const clusterElementsRef = useRef<Map<Cluster, google.maps.Marker>>(
    new Map()
  );
  const markerOverlays = useRef<Map<string, CustomMarkerOverlay>>(new Map());
  const labelOverlays = useRef<Map<string, LabelOverlay>>(new Map());

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  useEffect(() => {
    console.log("url stream Id", selectedStreamId);
    console.log("infer type of selectedStreamId", typeof selectedStreamId);
  }, [selectedStreamId]);

  // Utility functions and event handlers for map interactions, marker creation, and cluster management
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
    async (event: google.maps.MapMouseEvent, cluster: Cluster) => {
      event.stop();
      dispatch(setVisibility(false));
      const markerStreamIds = cluster.markers
        ?.map((marker) => (marker as CustomMarker).userData?.streamId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (markerStreamIds && markerStreamIds.length > 0) {
        await dispatch(fetchClusterData(markerStreamIds));
      }

      if (map) {
        const pixelPosition = getClusterPixelPosition(map, cluster.position);
        setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      }
      setSelectedCluster(cluster);
      dispatch(setVisibility(true));

      onClusterClick?.(cluster);
    },
    [dispatch, map, onClusterClick]
  );

  const updateClusterStyle = useCallback(
    (
      clusterMarker: google.maps.Marker,
      markers: google.maps.Marker[],
      thresholds: Thresholds
    ) => {
      const values = markers.map((marker) =>
        Number((marker as CustomMarker).value || 0)
      );
      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      const color = getColorForValue(thresholds, average);

      const hasPulsatingSession = markers.some(
        (marker) => (marker as CustomMarker).sessionId === pulsatingSessionId
      );

      const newIcon = createClusterIcon(color, hasPulsatingSession);

      clusterMarker.setIcon(newIcon);
      clusterMarker.setZIndex(
        hasPulsatingSession ? google.maps.Marker.MAX_ZINDEX + 2 : 1
      );
    },
    [pulsatingSessionId]
  );

  const handleThresholdChange = useCallback(() => {
    clusterElementsRef.current.forEach((clusterMarker, cluster) => {
      const markers =
        cluster.markers?.map((marker) => marker as google.maps.Marker) ?? [];
      updateClusterStyle(clusterMarker, markers, thresholds);
    });
  }, [
    thresholds,
    selectedStreamId,
    updateClusterStyle,
    unitSymbol,
    pulsatingSessionId,
  ]);

  const customRenderer = useMemo(
    () =>
      createFixedMarkersRenderer({
        thresholds,
        updateClusterStyle,
        clusterElementsRef,
      }),
    [thresholds, updateClusterStyle]
  );

  const createMarker = useCallback(
    (session: Session): CustomMarker => {
      // const isSelected =
      //   selectedStreamId != null &&
      //   session.point.streamId === selectedStreamId.toString();

      const marker = new google.maps.Marker({
        position: session.point,
        icon: {
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==", // Transparent 1x1 pixel
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1,
      }) as CustomMarker;

      marker.value = session.lastMeasurementValue;
      marker.sessionId = session.id;
      marker.userData = { streamId: session.point.streamId };
      marker.clustered = false;

      marker.addListener("click", () => {
        onMarkerClick(Number(session.point.streamId), Number(session.id));
        centerMapOnMarker(session.point);
      });

      return marker;
    },
    [
      thresholds,
      unitSymbol,
      pulsatingSessionId,
      onMarkerClick,
      centerMapOnMarker,
    ]
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

      // Remove overlays if marker is clustered or not selected
      const shouldRemoveOverlays =
        marker.clustered || (selectedStreamId && !isSelected);

      if (shouldRemoveOverlays) {
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
              onMarkerClick(
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
    onMarkerClick,
    centerMapOnMarker,
  ]);

  // Effect to manage markers: create, update, and remove markers based on sessions data

  useEffect(() => {
    if (!map || !clustererRef.current) return;

    const updatedMarkers: google.maps.Marker[] = [];
    const markersToRemove: CustomMarker[] = [];

    memoizedSessions.forEach((session) => {
      let marker = markerRefs.current.get(session.point.streamId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
        updatedMarkers.push(marker);
      } else {
        marker.setPosition(session.point);
        marker.value = session.lastMeasurementValue;
        marker.sessionId = session.id;
      }
    });

    // Identify markers to remove
    markerRefs.current.forEach((marker, streamId) => {
      if (!sessions.some((session) => session.point.streamId === streamId)) {
        markersToRemove.push(marker);
        markerRefs.current.delete(streamId);
      }
    });
    // Remove markers no longer in the sessions array
    if (markersToRemove.length > 0) {
      clustererRef.current.removeMarkers(markersToRemove);
      markersToRemove.forEach((marker) => marker.setMap(null));
    }
    // Add new markers
    if (updatedMarkers.length > 0) {
      clustererRef.current.addMarkers(updatedMarkers);
    }

    markersToRemove.forEach((marker) => {
      const streamId = marker.userData.streamId;
      const overlay = markerOverlays.current.get(streamId);
      if (overlay) {
        overlay.setMap(null);
        markerOverlays.current.delete(streamId);
      }
      const labelOverlay = labelOverlays.current.get(streamId);
      if (labelOverlay) {
        labelOverlay.setMap(null);
        labelOverlays.current.delete(streamId);
      }
      marker.setMap(null);
    });
    // Force clusterer update
    clustererRef.current.render();

    updateMarkerOverlays();
  }, [sessions, map, createMarker, thresholds, unitSymbol, pulsatingSessionId]);

  useEffect(() => {
    if (clustererRef.current) {
      clustererRef.current.addListener("clusteringend", () => {
        // console.log("clusteringend event fired");
        // Update clustered status for markers
        markerRefs.current.forEach((marker) => {
          (marker as CustomMarker).clustered = false;
        });
        // @ts-ignore
        clustererRef.current.clusters.forEach((cluster) => {
          if (cluster.markers && cluster.markers.length > 1) {
            cluster.markers.forEach((marker) => {
              (marker as CustomMarker).clustered = true;
            });
          }
        });
      });
    }
  }, [
    map,
    thresholds,
    pulsatingSessionId,
    updateMarkerOverlays,
    markerRefs.current,
  ]);

  useEffect(() => {
    updateMarkerOverlays();
  }, [pulsatingSessionId, markerRefs.current, sessions]);

  useEffect(() => {
    handleThresholdChange();
  }, [handleThresholdChange]);

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
    if (markerRefs.current.size >= memoizedSessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, sessions.length]);

  useEffect(() => {
    if (map && !clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: customRenderer,
        algorithm: new SuperClusterAlgorithm({
          maxZoom: 21,
          radius: CLUSTER_RADIUS,
        }),
        onClusterClick: handleClusterClickInternal,
      });

      clustererRef.current.addListener("clusteringend", () => {
        // Update clustered status for markers
        markerRefs.current.forEach((marker) => {
          (marker as CustomMarker).clustered = false;
        });
        // @ts-ignore
        clustererRef.current.clusters.forEach((cluster) => {
          if (cluster.markers && cluster.markers.length > 1) {
            cluster.markers.forEach((marker) => {
              (marker as CustomMarker).clustered = true;
            });
          }
        });
      });
    }
  }, [map, customRenderer, handleClusterClickInternal]);

  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        google.maps.event.clearInstanceListeners(clustererRef.current);
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current.clear();
      clusterElementsRef.current.forEach((clusterMarker) =>
        clusterMarker.setMap(null)
      );
      clusterElementsRef.current.clear();
      markerOverlays.current.forEach((overlay) => overlay.setMap(null));
      markerOverlays.current.clear();
      labelOverlays.current.forEach((overlay) => overlay.setMap(null));
      labelOverlays.current.clear();
    };
  }, []);

  return (
    <>
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {selectedCluster && clusterPosition && clusterVisible && clusterData && (
        <ClusterInfo
          color={getColorForValue(thresholds, clusterData.average)}
          average={clusterData.average}
          numberOfSessions={clusterData.numberOfInstruments}
          handleZoomIn={handleZoomIn}
          position={clusterPosition}
          visible={clusterVisible}
        />
      )}
    </>
  );
}
