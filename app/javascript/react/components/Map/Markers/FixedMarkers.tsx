"use client";

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
import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { StatusEnum } from "../../../types/api";
import { LatLngLiteral } from "../../../types/googleMaps";
import { Session } from "../../../types/sessionType";
import { Thresholds } from "../../../types/thresholds";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { createFixedMarkersRenderer } from "./ClusterConfiguration";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import { createClusterIcon, createMarkerIcon } from "./createMarkerIcon";
import HoverMarker from "./HoverMarker/HoverMarker";
import { CustomMarkerOverlay } from "./customMarkerOverlay";

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
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());
  const clusterElementsRef = useRef<Map<Cluster, google.maps.Marker>>(
    new Map()
  );
  const markerOverlays = useRef<Map<string, CustomMarkerOverlay>>(new Map());

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const updateMarkerOverlays = useCallback(() => {
    markerRefs.current.forEach((marker, streamId) => {
      const isSelected =
        marker.userData?.streamId === selectedStreamId?.toString();
      const shouldPulse =
        marker.sessionId === pulsatingSessionId && !marker.clustered;
      const newColor = getColorForValue(thresholds, marker.value);

      console.log(`Marker ${streamId}: clustered=${marker.clustered}`);

      const existingOverlay = markerOverlays.current.get(streamId);

      if (marker.clustered) {
        // If the marker is clustered, remove its overlay if it exists
        if (existingOverlay) {
          existingOverlay.setMap(null);
          markerOverlays.current.delete(streamId);
        }
      } else {
        // The marker is not clustered, so it should have an overlay
        if (existingOverlay) {
          // Update overlay if properties have changed
          let needsUpdate = false;

          if (existingOverlay.getIsSelected() !== isSelected) {
            existingOverlay.setIsSelected(isSelected);
            needsUpdate = true;
          }
          if (existingOverlay.getShouldPulse() !== shouldPulse) {
            existingOverlay.setShouldPulse(shouldPulse);
            needsUpdate = true;
          }
          if (existingOverlay.getColor() !== newColor) {
            existingOverlay.setColor(newColor);
            needsUpdate = true;
          }
          if (needsUpdate) {
            existingOverlay.update();
          }
        } else {
          // Create new overlay
          const overlay = new CustomMarkerOverlay(
            marker.getPosition()!,
            newColor,
            isSelected,
            shouldPulse
          );
          overlay.setMap(map);
          markerOverlays.current.set(streamId, overlay);
          console.log(`Overlay created for marker ${streamId}`);
        }
      }
    });
  }, [map, selectedStreamId, pulsatingSessionId, thresholds]);

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

    markerRefs.current.forEach((marker) => {
      const value = Number(marker.value || 0);
      const newIcon = createMarkerIcon(
        getColorForValue(thresholds, value),
        `${Math.round(value)} ${unitSymbol}`,
        marker.userData?.streamId === selectedStreamId?.toString()
      );
      marker.setIcon(newIcon);
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
      const isSelected =
        selectedStreamId != null &&
        session.point.streamId === selectedStreamId.toString();

      const marker = new google.maps.Marker({
        position: session.point,
        icon: createMarkerIcon(
          getColorForValue(thresholds, session.lastMeasurementValue),
          `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
          isSelected
        ),
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
      selectedStreamId,
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

  // Effect to manage markers: create, update, and remove markers based on sessions data

  useEffect(() => {
    if (!map || !clustererRef.current) return;

    const updatedMarkers: google.maps.Marker[] = [];
    const markersToRemove: google.maps.Marker[] = [];

    memoizedSessions.forEach((session) => {
      let marker = markerRefs.current.get(session.point.streamId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
        updatedMarkers.push(marker);
      } else {
        const newIcon = createMarkerIcon(
          getColorForValue(thresholds, session.lastMeasurementValue),
          `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
          session.point.streamId === selectedStreamId?.toString()
        );

        // Update existing marker
        marker.setIcon(newIcon);
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
    // Force clusterer update
    clustererRef.current.render();

    updateMarkerOverlays();
  }, [
    sessions,
    map,
    createMarker,
    thresholds,
    unitSymbol,
    selectedStreamId,
    pulsatingSessionId,
  ]);

  useEffect(() => {
    return () => {
      if (clustererRef.current) {
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
    };
  }, []);

  useEffect(() => {
    if (clustererRef.current) {
      clustererRef.current.addListener("clusteringend", () => {
        console.log("clusteringend event fired");
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

        // Update marker icons and overlays
        updateMarkerOverlays();
      });
    }
  }, [
    map,
    thresholds,
    selectedStreamId,
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
    const handleSelectedStreamId = (streamId: number | null) => {
      if (!streamId || fixedStreamStatus === StatusEnum.Pending) return;
      const { latitude, longitude } = fixedStreamData?.stream ?? {};

      if (latitude && longitude) {
        const fixedStreamPosition = { lat: latitude, lng: longitude };
        centerMapOnMarker(fixedStreamPosition);
      } else {
        console.error(
          `Stream ID ${streamId} not found or missing latitude/longitude in fixedStream data.`
        );
      }
    };

    handleSelectedStreamId(selectedStreamId);
  }, [selectedStreamId, fixedStreamData, fixedStreamStatus, centerMapOnMarker]);

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
        console.log("clusteringend event fired");
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
        // Update marker icons and overlays
        updateMarkerOverlays();
      });
    }
  }, [map, customRenderer, handleClusterClickInternal]);

  useEffect(() => {
    updateMarkerOverlays();
  }, [pulsatingSessionId, selectedStreamId, updateMarkerOverlays]);

  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        google.maps.event.clearInstanceListeners(clustererRef.current);
      }
      markerOverlays.current.forEach((overlay) => overlay.setMap(null));
      markerOverlays.current.clear();
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
