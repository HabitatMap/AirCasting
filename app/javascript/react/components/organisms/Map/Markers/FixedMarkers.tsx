import { type Cluster, MarkerClusterer } from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  setAverage,
  setSize,
  setVisibility,
} from "../../../../store/clusterSlice";
import {
  selectFixedStreamData,
  selectFixedStreamStatus,
  selectIsLoading,
} from "../../../../store/fixedStreamSelectors";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { selectHoverStreamId } from "../../../../store/mapSlice";
import { setMarkersLoading } from "../../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../../store/thresholdSlice";
import { StatusEnum } from "../../../../types/api";
import type { LatLngLiteral } from "../../../../types/googleMaps";
import type { FixedSession } from "../../../../types/sessionType";
import { getClusterPixelPosition } from "../../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../../utils/mapEventListeners";
import { useMapParams } from "../../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../../utils/thresholdColors";
import { ClusterInfo, ClusterInfoLoading } from "./ClusterInfo/ClusterInfo";

import { UserSettings } from "../../../../types/userStates";
import HoverMarker from "./HoverMarker/HoverMarker";

import { calculateClusterAverage } from "./ClusterMarker/clusterCalculations";
import { ClusterOverlay } from "./ClusterMarker/clusterOverlay";
import { LabelOverlay } from "./CustomOverlays/customMarkerLabel";
import { CustomMarkerOverlay } from "./CustomOverlays/customMarkerOverlay";
import { CustomAlgorithm } from "./gridClusterAlgorithm";

type CustomMarker = google.maps.Marker & {
  value: number | null;
  sessionId: number;
  userData: { streamId: string };
  clustered: boolean;
};

export type CustomCluster = Cluster & {
  id: string;
};

type FixedMarkersProps = {
  sessions: FixedSession[];
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
  const clusterVisible = useAppSelector((state) => state.cluster.visible);
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);
  const clusterAverage = useAppSelector(
    (state) => state.cluster.clusterAverage
  );
  const clusterSize = useAppSelector((state) => state.cluster.clusterSize);

  // Refs
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());
  const markerOverlays = useRef<Map<string, CustomMarkerOverlay>>(new Map());
  const labelOverlays = useRef<Map<string, LabelOverlay>>(new Map());
  const clusterOverlaysRef = useRef<Map<string, ClusterOverlay>>(new Map());
  const previousZoomRef = useRef<number | null>(null);
  const initialCenterRef = useRef<boolean>(false);

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

  const isLoading = useAppSelector(selectIsLoading);

  // Refs for event handlers
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
    initialCenterRef.current = false;
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
      if (cluster.markers) {
        const average = calculateClusterAverage(
          cluster.markers as CustomMarker[]
        );
        dispatch(setAverage(average));
        dispatch(setSize(cluster.markers?.length || 0));
      }

      setClusterDataLoading(false);
      dispatch(setVisibility(true));
      onClusterClick?.(cluster);
    },
    [dispatch, map, onClusterClick]
  );

  const handleClusteringEnd = useCallback(() => {
    const currentZoom = map?.getZoom() ?? null;
    if (currentZoom === previousZoomRef.current) {
      return;
    }
    previousZoomRef.current = currentZoom;
    markerRefs.current.forEach((marker) => {
      (marker as CustomMarker).clustered = false;
    });

    const clusters =
      clustererRef.current &&
      // @ts-ignore - clusters
      (clustererRef.current.clusters as CustomCluster[]);

    clusterOverlaysRef.current.forEach((overlay) => {
      overlay.setMap(null);
    });
    clusterOverlaysRef.current.clear();

    if (!clusters) return;

    const bounds = map?.getBounds();
    clusters.forEach((cluster) => {
      if (
        cluster.markers &&
        cluster.markers.length > 1 &&
        bounds?.contains(cluster.position)
      ) {
        cluster.markers.forEach((marker) => {
          (marker as CustomMarker).clustered = true;
        });

        const markers = cluster.markers as CustomMarker[];
        const values = markers.map((marker) => marker.value || 0);
        const average =
          values.reduce((sum, value) => sum + value, 0) / values.length;
        const color = getColorForValue(thresholds, average);

        const hasPulsatingSession =
          pulsatingSessionId !== null &&
          markers.some((marker) => marker.sessionId === pulsatingSessionId);

        const overlay = new ClusterOverlay(
          cluster,
          color,
          hasPulsatingSession,
          map!,
          handleClusterClickInternal
        );
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
    (session: FixedSession): CustomMarker => {
      const marker = new google.maps.Marker({
        position: session.point,
        icon: {
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1,
      }) as CustomMarker;

      marker.value = session.averageValue;
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

  const isMarkerInViewport = useCallback(
    (marker: CustomMarker) => {
      if (!map) return false;
      const bounds = map.getBounds();
      return bounds ? bounds.contains(marker.getPosition()!) : false;
    },
    [map]
  );

  const updateMarkerOverlays = useCallback(() => {
    const bounds = map?.getBounds();
    markerRefs.current.forEach((marker, streamId) => {
      const isVisible = bounds ? bounds.contains(marker.getPosition()!) : false;
      const isSelected =
        marker.userData?.streamId === selectedStreamId?.toString();
      const shouldPulse =
        marker.sessionId === pulsatingSessionId && !marker.clustered;
      const newColor = getColorForValue(thresholds, marker.value);
      const existingOverlay = markerOverlays.current.get(streamId);
      const existingLabelOverlay = labelOverlays.current.get(streamId);
      const position = marker.getPosition();

      if (marker.clustered || !isVisible) {
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
            marker.value === null ? "Calculating..." : marker.value,
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
            marker.value === null ? "Calculating..." : marker.value,
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
    isLoading,
  ]);

  useEffect(() => {
    if (fixedStreamStatus === StatusEnum.Pending) return;

    if (selectedStreamId === null) {
      if (!clustererRef.current && map) {
        const algorithm = new CustomAlgorithm();
        clustererRef.current = new MarkerClusterer({
          map,
          markers: [],
          renderer: customRenderer,
          algorithm,
        });

        clustererRef.current.addListener("clusteringend", handleClusteringEnd);
      }

      // Create markers for all sessions if they don't exist
      memoizedSessions.forEach((session) => {
        if (!markerRefs.current.has(session.point.streamId)) {
          const marker = createMarker(session);
          markerRefs.current.set(session.point.streamId, marker);
        }
      });

      // Ensure clusterer is properly initialized and has all markers
      if (clustererRef.current) {
        const allMarkers = Array.from(markerRefs.current.values());
        clustererRef.current.clearMarkers();
        clustererRef.current.addMarkers(allMarkers);
        clustererRef.current.render();
      }

      updateMarkerOverlays();
      updateClusterOverlays();
    } else {
      if (fixedStreamData?.stream) {
        const { latitude, longitude } = fixedStreamData.stream;
        if (latitude && longitude) {
          const fixedStreamPosition = { lat: latitude, lng: longitude };

          // Only center on first render
          if (!initialCenterRef.current) {
            centerMapOnMarker(fixedStreamPosition);
            initialCenterRef.current = true;
          }

          if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current.setMap(null);
            clustererRef.current = null;
          }

          markerRefs.current.forEach((marker, streamIdKey) => {
            if (streamIdKey !== selectedStreamId.toString()) {
              marker.setMap(null);
              markerRefs.current.delete(streamIdKey);

              const markerOverlay = markerOverlays.current.get(streamIdKey);
              if (markerOverlay) {
                markerOverlay.setMap(null);
                markerOverlays.current.delete(streamIdKey);
              }
              const labelOverlay = labelOverlays.current.get(streamIdKey);
              if (labelOverlay) {
                labelOverlay.setMap(null);
                labelOverlays.current.delete(streamIdKey);
              }
            }
          });

          const selectedMarker = markerRefs.current.get(
            selectedStreamId.toString()
          );
          if (!selectedMarker) {
            const session = memoizedSessions.find(
              (session) =>
                session.point.streamId === selectedStreamId.toString()
            );
            if (session) {
              const newMarker = createMarker(session);
              markerRefs.current.set(session.point.streamId, newMarker);
              newMarker.setMap(map);
              const value = session.averageValue;
              const color = getColorForValue(thresholds, value);

              const newOverlay = new CustomMarkerOverlay(
                new google.maps.LatLng(latitude, longitude),
                color,
                true,
                false
              );
              newOverlay.setMap(map);
              markerOverlays.current.set(session.point.streamId, newOverlay);

              const newLabelOverlay = new LabelOverlay(
                new google.maps.LatLng(latitude, longitude),
                color,
                value === null ? "Calculating..." : value,
                unitSymbol,
                true,
                () => {
                  onMarkerClickRef.current(
                    Number(session.point.streamId),
                    Number(session.id)
                  );
                  centerMapOnMarker(fixedStreamPosition);
                }
              );
              newLabelOverlay.setMap(map);
              labelOverlays.current.set(
                session.point.streamId,
                newLabelOverlay
              );
            }
          }

          clusterOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
          clusterOverlaysRef.current.clear();
        }
      }
    }
  }, [
    selectedStreamId,
    fixedStreamStatus,
    fixedStreamData,
    map,
    customRenderer,
    handleClusteringEnd,
    updateMarkerOverlays,
    updateClusterOverlays,
    memoizedSessions,
    createMarker,
    thresholds,
    unitSymbol,
    centerMapOnMarker,
  ]);

  useEffect(() => {
    if (!map || !clustererRef.current) return;

    const bounds = map.getBounds();
    const updatedMarkers: google.maps.Marker[] = [];
    const markersToRemove: CustomMarker[] = [];

    memoizedSessions.forEach((session) => {
      let marker = markerRefs.current.get(session.point.streamId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
        if (bounds?.contains(marker.getPosition()!)) {
          updatedMarkers.push(marker);
        }
      } else {
        marker.setPosition(session.point);
        marker.value = session.averageValue;
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

    // Remove overlays for removed markers
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
    updateClusterOverlays();
  }, [
    sessions,
    map,
    createMarker,
    thresholds,
    unitSymbol,
    pulsatingSessionId,
    updateMarkerOverlays,
    updateClusterOverlays,
    memoizedSessions,
    isLoading,
  ]);

  useEffect(() => {
    if (clustererRef.current) {
      clustererRef.current.addListener("clusteringend", () => {
        markerRefs.current.forEach((marker) => {
          (marker as CustomMarker).clustered = false;
        });

        const clusters =
          clustererRef.current &&
          // @ts-ignore - clusters
          (clustererRef.current.clusters as CustomCluster[]);

        clusterOverlaysRef.current.forEach((overlay) => {
          overlay.setMap(null);
        });
        clusterOverlaysRef.current.clear();

        if (!clusters) return;

        clusters.forEach((cluster) => {
          if (cluster.markers && cluster.markers.length > 1) {
            cluster.markers.forEach((marker) => {
              (marker as CustomMarker).clustered = true;
            });

            const markers = cluster.markers as CustomMarker[];
            const values = markers.map((marker) => marker.value || 0);
            const average =
              values.reduce((sum, value) => sum + value, 0) / values.length;
            const color = getColorForValue(thresholds, average);

            const hasPulsatingSession =
              pulsatingSessionId !== null &&
              markers.some((marker) => marker.sessionId === pulsatingSessionId);

            const overlay = new ClusterOverlay(
              cluster,
              color,
              hasPulsatingSession,
              map!,
              handleClusterClickInternal
            );

            const clusterKey = `${cluster.position
              .lat()
              .toFixed(6)}_${cluster.position.lng().toFixed(6)}`;
            clusterOverlaysRef.current.set(clusterKey, overlay);
          }
        });
      });
    }
  }, [
    map,
    thresholds,
    sessions,
    pulsatingSessionId,
    handleClusterClickInternal,
    isLoading,
  ]);

  useEffect(() => {
    updateMarkerOverlays();
    updateClusterOverlays();
  }, [
    pulsatingSessionId,
    selectedStreamId,
    sessions,
    updateMarkerOverlays,
    updateClusterOverlays,
  ]);

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
  }, [dispatch, sessions.length, memoizedSessions.length]);

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

    // Reset the initial center ref
    initialCenterRef.current = false;
  }, []);

  // Watch for mode changes using currentUserSettings
  const previousUserSettingsRef = useRef<string | null>(null);

  useEffect(() => {
    const currentMode = currentUserSettings;
    const previousMode = previousUserSettingsRef.current;

    // Clear markers when switching to/from timelapse view
    if (
      previousMode &&
      ((previousMode === UserSettings.TimelapseView &&
        currentMode !== UserSettings.TimelapseView) ||
        (previousMode !== UserSettings.TimelapseView &&
          currentMode === UserSettings.TimelapseView))
    ) {
      clearAllMarkersAndClusters();
    }

    previousUserSettingsRef.current = currentMode;

    // Cleanup on unmount
    return () => {
      clearAllMarkersAndClusters();
    };
  }, []);

  useEffect(() => {
    if (clustererRef.current && map) {
      // Force re-clustering
      clustererRef.current.render();
      handleClusteringEnd();
    }
  }, [map?.getZoom(), currentUserSettings, handleClusteringEnd]);

  useEffect(() => {
    if (map) {
      const listener = map.addListener("idle", updateMarkerOverlays);
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, updateMarkerOverlays]);

  return (
    <>
      {hoverPosition && <HoverMarker position={hoverPosition} />}
      {clusterPosition &&
        selectedCluster &&
        (clusterDataLoading ? (
          <ClusterInfoLoading position={clusterPosition} visible={true} />
        ) : (
          <ClusterInfo
            color={getColorForValue(thresholds, clusterAverage)}
            average={clusterAverage}
            numberOfSessions={clusterSize}
            handleZoomIn={handleZoomIn}
            position={clusterPosition}
            visible={clusterVisible}
          />
        ))}
    </>
  );
}
