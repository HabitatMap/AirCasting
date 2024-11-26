import { Cluster, MarkerClusterer } from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import debounce from "lodash/debounce";
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
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterInfo, ClusterInfoLoading } from "./ClusterInfo/ClusterInfo";

import HoverMarker from "./HoverMarker/HoverMarker";
import { ClusterOverlay } from "./clusterOverlay";
import { LabelOverlay } from "./customMarkerLabel";
import { CustomMarkerOverlay } from "./customMarkerOverlay";
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
const CLUSTER_RADIUS = 40;

export function FixedMarkers({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
  onClusterClick,
}: FixedMarkersProps) {
  console.log("FixedMarkers component rendering", {
    sessionCount: sessions.length,
    selectedStreamId,
    pulsatingSessionId,
  });

  // Add initial useEffect to track mounting
  useEffect(() => {
    console.log("FixedMarkers component mounted");

    return () => {
      console.log("FixedMarkers component unmounting");
    };
  }, []);

  // Add log to track map availability
  const map = useMap();
  useEffect(() => {
    console.log("Map status changed:", {
      isMapAvailable: !!map,
      zoom: map?.getZoom(),
      center: map?.getCenter()?.toJSON(),
    });
  }, [map]);

  // Add log to track sessions changes
  useEffect(() => {
    console.log("Sessions updated:", {
      count: sessions.length,
      firstSessionId: sessions[0]?.id,
      lastSessionId: sessions[sessions.length - 1]?.id,
    });
  }, [sessions]);

  // Add log to clusterer initialization
  useEffect(() => {
    console.log("Checking clusterer initialization:", {
      hasMap: !!map,
      hasClusterer: !!clustererRef.current,
      sessionCount: sessions.length,
    });

    if (map && !clustererRef.current) {
      console.log("Creating new clusterer");
      // ... rest of clusterer initialization
    }
  }, [map]);

  const dispatch = useAppDispatch();
  const { unitSymbol } = useMapParams();

  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const clusterData = useAppSelector((state) => state.cluster.data);
  const clusterVisible = useAppSelector((state) => state.cluster.visible);

  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);

  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());

  const markerOverlays = useRef<Map<string, CustomMarkerOverlay>>(new Map());
  const labelOverlays = useRef<Map<string, LabelOverlay>>(new Map());
  const clusterOverlaysRef = useRef<Map<string, ClusterOverlay>>(new Map());
  const previousZoomRef = useRef<number | null>(null);

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [clusterDataLoading, setClusterDataLoading] = useState<boolean>(false);

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  // Ref for onMarkerClick to avoid stale closures
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

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
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==", // Transparent 1x1 pixel
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
    [centerMapOnMarker] // Removed onMarkerClick from dependencies
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

  const handleSelectedStreamIdChange = useCallback(
    (streamId: number | null) => {
      if (fixedStreamStatus === StatusEnum.Pending) return;

      if (streamId === null) {
        // Reinitialize markers and clusters
        if (!clustererRef.current && map) {
          clustererRef.current = new MarkerClusterer({
            map,
            markers: [],
            renderer: customRenderer,
            algorithm: new CustomAlgorithm(),
          });

          clustererRef.current.addListener(
            "clusteringend",
            handleClusteringEnd
          );
        }

        // Re-add all markers to the clusterer
        const allMarkers = Array.from(markerRefs.current.values());
        clustererRef.current!.addMarkers(allMarkers);

        // Force clusterer update
        clustererRef.current!.render();

        // Update overlays for all markers
        updateMarkerOverlays();
        updateClusterOverlays();
      } else {
        // Handle single selected stream
        if (fixedStreamData?.stream) {
          const { latitude, longitude } = fixedStreamData.stream;
          if (latitude && longitude) {
            const fixedStreamPosition = { lat: latitude, lng: longitude };

            centerMapOnMarker(fixedStreamPosition);

            // Clear the clusterer
            if (clustererRef.current) {
              clustererRef.current.clearMarkers();
              clustererRef.current.setMap(null);
              clustererRef.current = null;
            }

            // Remove markers and overlays not related to selected stream
            markerRefs.current.forEach((marker, streamIdKey) => {
              if (streamIdKey !== streamId.toString()) {
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

            // Ensure the selected stream's marker and overlays are present
            const selectedMarker = markerRefs.current.get(streamId.toString());
            if (!selectedMarker) {
              const session = memoizedSessions.find(
                (session) => session.point.streamId === streamId.toString()
              );
              if (session) {
                const newMarker = createMarker(session);
                markerRefs.current.set(session.point.streamId, newMarker);
                newMarker.setMap(map);

                const newOverlay = new CustomMarkerOverlay(
                  new google.maps.LatLng(latitude, longitude),
                  getColorForValue(thresholds, session.lastMeasurementValue),
                  true,
                  false
                );
                newOverlay.setMap(map);
                markerOverlays.current.set(session.point.streamId, newOverlay);

                const newLabelOverlay = new LabelOverlay(
                  new google.maps.LatLng(latitude, longitude),
                  getColorForValue(thresholds, session.lastMeasurementValue),
                  session.lastMeasurementValue,
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

            // Remove all cluster overlays
            clusterOverlaysRef.current.forEach((overlay) =>
              overlay.setMap(null)
            );
            clusterOverlaysRef.current.clear();
          }
        }
      }
    },
    [
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
    ]
  );

  useEffect(() => {
    handleSelectedStreamIdChange(selectedStreamId);
  }, [selectedStreamId, handleSelectedStreamIdChange]);

  // Add new state to track marker loading
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const markerLoadingCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Add function to check if all markers are loaded
  const checkMarkersLoaded = useCallback(() => {
    const allMarkersLoaded = memoizedSessions.every((session) =>
      markerRefs.current.has(session.point.streamId)
    );

    if (allMarkersLoaded) {
      setMarkersLoaded(true);
      if (markerLoadingCheckRef.current) {
        clearInterval(markerLoadingCheckRef.current);
      }
    }
  }, [memoizedSessions]);

  // Add ref to track projection availability
  const projectionAvailableRef = useRef(false);

  // Modify the projection check effect
  useEffect(() => {
    if (!map || !clustererRef.current || projectionAvailableRef.current) {
      return;
    }

    const checkProjection = () => {
      if (map.getProjection() && !projectionAvailableRef.current) {
        console.log(
          "Projection became available, forcing one-time recalculation"
        );
        projectionAvailableRef.current = true;
        if (algorithmRef.current && clustererRef.current) {
          algorithmRef.current.clearCache();
          clustererRef.current.render();
        }
        return true; // Projection is now available
      }
      return false;
    };

    // Check immediately
    if (checkProjection()) {
      return; // If projection is available immediately, don't set up interval
    }

    // Set up interval only if needed
    const projectionCheckInterval = setInterval(() => {
      if (checkProjection()) {
        clearInterval(projectionCheckInterval);
      }
    }, 100);

    // Safety cleanup after 5 seconds
    const projectionTimeout = setTimeout(() => {
      clearInterval(projectionCheckInterval);
    }, 5000);

    return () => {
      clearInterval(projectionCheckInterval);
      clearTimeout(projectionTimeout);
    };
  }, [map]);

  // Add effect to check marker loading status
  useEffect(() => {
    if (!markersLoaded && sessions.length > 0) {
      markerLoadingCheckRef.current = setInterval(checkMarkersLoaded, 100);

      // Safety timeout after 5 seconds
      const safetyTimeout = setTimeout(() => {
        if (markerLoadingCheckRef.current) {
          clearInterval(markerLoadingCheckRef.current);
        }
        setMarkersLoaded(true);
      }, 5000);

      return () => {
        if (markerLoadingCheckRef.current) {
          clearInterval(markerLoadingCheckRef.current);
        }
        clearTimeout(safetyTimeout);
      };
    }
  }, [sessions.length, markersLoaded, checkMarkersLoaded]);

  // Reset markers loaded state when sessions change
  useEffect(() => {
    setMarkersLoaded(false);
  }, [sessions]);

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
    updateClusterOverlays();
  }, [sessions, map, createMarker, thresholds, unitSymbol, pulsatingSessionId]);

  useEffect(() => {
    if (clustererRef.current) {
      clustererRef.current.addListener("clusteringend", () => {
        // Update clustered status for markers
        markerRefs.current.forEach((marker) => {
          (marker as CustomMarker).clustered = false;
        });

        const clusters =
          clustererRef.current &&
          // @ts-ignore - clusters
          (clustererRef.current.clusters as CustomCluster[]);

        // Remove existing cluster overlays
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
  ]);

  useEffect(() => {
    updateMarkerOverlays();
    updateClusterOverlays();
  }, [pulsatingSessionId, selectedStreamId, markerRefs.current, sessions]);

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

  // Add new ref to track initial clustering
  const initialClusteringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Add ref for algorithm instance
  const algorithmRef = useRef<CustomAlgorithm | null>(null);

  // Add debounced render function
  const debouncedRender = useMemo(
    () =>
      debounce(() => {
        if (clustererRef.current) {
          console.log("Executing debounced render");
          clustererRef.current.render();
        }
      }, 500),
    []
  );

  // Modify clusterer initialization
  useEffect(() => {
    if (map && !clustererRef.current) {
      console.log("Initializing clusterer");

      algorithmRef.current = new CustomAlgorithm({});

      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: customRenderer,
        algorithm: algorithmRef.current,

        // Add these options to reduce unnecessary updates
      });

      // Use debounced render for clustering end
      clustererRef.current.addListener("clusteringend", () => {
        console.log("Clustering end event fired");
        handleClusteringEnd();
      });
    }

    return () => {
      debouncedRender.cancel();
    };
  }, [map, customRenderer, handleClusteringEnd, debouncedRender]);

  // Modify marker update effect
  useEffect(() => {
    if (!map || !clustererRef.current) return;

    console.log("Updating markers");

    // Batch marker updates
    const batchSize = 100;
    const markers = [...markerRefs.current.values()];

    const updateBatch = (startIndex: number) => {
      const batch = markers.slice(startIndex, startIndex + batchSize);
      if (batch.length === 0) return;

      batch.forEach((marker) => {
        const session = memoizedSessions.find(
          (s) => s.point.streamId === (marker as CustomMarker).userData.streamId
        );
        if (session) {
          marker.setPosition(session.point);
          (marker as CustomMarker).value = session.lastMeasurementValue;
        }
      });

      if (startIndex + batchSize < markers.length) {
        requestAnimationFrame(() => updateBatch(startIndex + batchSize));
      } else {
        // Only render once all updates are complete
        debouncedRender();
      }
    };

    updateBatch(0);
  }, [memoizedSessions, debouncedRender]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      debouncedRender.cancel();
      if (algorithmRef.current) {
        algorithmRef.current.clearCache();
      }
      if (clustererRef.current) {
        clustererRef.current.setMap(null);
      }
    };
  }, [debouncedRender]);

  // Add marker batch processing state
  const [isProcessingMarkers, setIsProcessingMarkers] = useState(false);
  const markerBatchSize = 200; // Increased batch size for better performance

  // Modify marker creation effect
  useEffect(() => {
    if (!map || !clustererRef.current || isProcessingMarkers) return;

    const createMarkerBatch = async (startIndex: number) => {
      setIsProcessingMarkers(true);

      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          const endIndex = Math.min(
            startIndex + markerBatchSize,
            memoizedSessions.length
          );
          const batch = memoizedSessions.slice(startIndex, endIndex);

          batch.forEach((session) => {
            if (!markerRefs.current.has(session.point.streamId)) {
              const marker = createMarker(session);
              markerRefs.current.set(session.point.streamId, marker);
            }
          });

          if (endIndex < memoizedSessions.length) {
            createMarkerBatch(endIndex).then(resolve);
          } else {
            resolve();
          }
        });
      });
    };

    const initializeMarkers = async () => {
      console.log("Starting marker initialization");
      await createMarkerBatch(0);

      // Add all markers to clusterer at once
      const allMarkers = Array.from(markerRefs.current.values());
      console.log("Adding markers to clusterer", { count: allMarkers.length });

      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.addMarkers(allMarkers);
      }

      setIsProcessingMarkers(false);
    };

    initializeMarkers();
  }, [map, memoizedSessions, createMarker]);

  // Optimize clusterer initialization
  useEffect(() => {
    if (map && !clustererRef.current) {
      console.log("Initializing clusterer");

      algorithmRef.current = new CustomAlgorithm({
        batchSize: markerBatchSize,
        gridSizeInitial: 60, // Larger initial grid for better performance
      });

      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: customRenderer,
        algorithm: algorithmRef.current,
      });
    }
  }, [map]);

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
