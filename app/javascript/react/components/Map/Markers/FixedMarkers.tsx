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
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";
import { CustomMarkerOverlay } from "./customMarkerOverlay";
import { LabelOverlay } from "./customMarkerLabel";
import { ClusterOverlay } from "./clusterOverlay";

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
  const dispatch = useAppDispatch();
  const map = useMap();
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

  const memoizedSessions = useMemo(() => sessions, [sessions]);

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

  const updateClusterOverlays = useCallback(() => {
    clusterOverlaysRef.current.forEach((overlay) => {
      const cluster = overlay.cluster;
      const markers = cluster.markers as CustomMarker[];
      const hasPulsatingSession =
        pulsatingSessionId !== null &&
        markers.some((marker) => marker.sessionId === pulsatingSessionId);

      overlay.setShouldPulse(hasPulsatingSession);
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
        handleClusteringEnd();
      });
    }
  }, [map, customRenderer, handleClusterClickInternal]);

  // Needed to handle fixed session opened in a new tab - otherwise markers won't appear
  useEffect(() => {
    const handleSelectedStreamId = (streamId: number | null) => {
      if (fixedStreamStatus === StatusEnum.Pending) return;
      if (streamId) {
        const { latitude, longitude } = fixedStreamData?.stream ?? {};

        if (latitude && longitude) {
          const fixedStreamPosition = { lat: latitude, lng: longitude };
          const fixedStreamPosition2 = new google.maps.LatLng(
            latitude,
            longitude
          );
          centerMapOnMarker(fixedStreamPosition);

          // Clear the clusterer
          if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current.setMap(null);
            clustererRef.current = null;
          }

          // Remove markers not related to selected stream
          markerRefs.current.forEach((marker, streamIdKey) => {
            if (streamIdKey !== streamId.toString()) {
              marker.setMap(null);
              markerRefs.current.delete(streamIdKey);
            }
          });

          // Remove marker overlays not related to selected stream
          markerOverlays.current.forEach((overlay, streamIdKey) => {
            if (streamIdKey !== streamId.toString()) {
              overlay.setMap(null);
              markerOverlays.current.delete(streamIdKey);
            }
          });

          // Remove label overlays not related to selected stream
          labelOverlays.current.forEach((overlay, streamIdKey) => {
            if (streamIdKey !== streamId.toString()) {
              overlay.setMap(null);
              labelOverlays.current.delete(streamIdKey);
            }
          });

          // On an initial selected stream load, remember to add marker and label overlays
          if (!markerRefs.current.has(streamId.toString())) {
            const session = memoizedSessions.find(
              (session) => session.point.streamId === streamId.toString()
            );
            if (session) {
              const marker = createMarker(session);
              markerRefs.current.set(session.point.streamId, marker);
              marker.setMap(map);

              const overlay = new CustomMarkerOverlay(
                fixedStreamPosition2,
                getColorForValue(thresholds, session.lastMeasurementValue),
                true,
                false
              );
              overlay.setMap(map);
              markerOverlays.current.set(session.point.streamId, overlay);

              const labelOverlay = new LabelOverlay(
                fixedStreamPosition2,
                getColorForValue(thresholds, session.lastMeasurementValue),
                session.lastMeasurementValue,
                unitSymbol,
                true,
                () => {
                  onMarkerClick(
                    Number(session.point.streamId),
                    Number(session.id)
                  );
                  centerMapOnMarker(fixedStreamPosition);
                }
              );
              labelOverlay.setMap(map);
              labelOverlays.current.set(session.point.streamId, labelOverlay);
            }
          }

          // Remove all cluster overlays
          clusterOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
          clusterOverlaysRef.current.clear();
        } else {
          console.error(
            `Stream ID ${streamId} not found or missing latitude/longitude in fixedStream data.`
          );
        }
      } else {
        // If selectedStreamId is null, reinitialize markers and clusters
        // Re-add the clusterer if it's not present
        if (!clustererRef.current && map) {
          clustererRef.current = new MarkerClusterer({
            map,
            markers: [],
            renderer: customRenderer,
            algorithm: new SuperClusterAlgorithm({
              maxZoom: 21,
              radius: CLUSTER_RADIUS,
            }),
          });

          clustererRef.current.addListener(
            "clusteringend",
            handleClusteringEnd
          );
        }

        // Re-add markers
        const updatedMarkers: CustomMarker[] = [];
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

        // Add new markers to clusterer
        if (updatedMarkers.length > 0) {
          clustererRef.current!.addMarkers(updatedMarkers);
        }

        // Force clusterer update
        clustererRef.current!.render();
      }
    };
    updateMarkerOverlays();
    handleSelectedStreamId(selectedStreamId);

    updateClusterOverlays();
  }, [
    selectedStreamId,
    fixedStreamData,
    fixedStreamStatus,
    centerMapOnMarker,
    map,
    memoizedSessions,
    createMarker,
    handleClusteringEnd,
    customRenderer,
  ]);

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
      clusterOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      clusterOverlaysRef.current.clear();
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
