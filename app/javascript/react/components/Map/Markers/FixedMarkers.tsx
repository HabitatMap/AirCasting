import { Cluster, MarkerClusterer } from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { RootState } from "../../../store";
import { fetchClusterData, setVisibility } from "../../../store/clusterSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getClusterPixelPosition } from "../../../utils/getClusterPixelPosition";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { customRenderer } from "./ClusterConfiguration";

import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { StatusEnum } from "../../../types/api";
import type { LatLngLiteral } from "../../../types/googleMaps";
import useMapEventListeners from "../../../utils/mapEventListeners";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";
import { createMarkerIcon } from "./createMarkerIcon";

type Props = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const FixedMarkers: React.FC<Props> = React.memo(
  ({ sessions, onMarkerClick, selectedStreamId, pulsatingSessionId }) => {
    const ZOOM_FOR_SELECTED_SESSION = 15;

    const dispatch = useAppDispatch();
    const map = useMap();
    const { unitSymbol } = useMapParams();

    const clusterData = useAppSelector(
      (state: RootState) => state.cluster.data
    );
    const fixedStreamData = useAppSelector(selectFixedStreamData);
    const clusterLoading = useAppSelector(
      (state: RootState) => state.cluster.loading
    );
    const clusterVisible = useAppSelector(
      (state: RootState) => state.cluster.visible
    );
    const hoverStreamId = useAppSelector(selectHoverStreamId);
    const thresholds = useAppSelector(selectThresholds);
    const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);

    const clusterer = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<{ [streamId: string]: google.maps.Marker }>({});

    const [clusterPosition, setClusterPosition] = useState<{
      top: number;
      left: number;
    } | null>(null);
    const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
      null
    );
    const [selectedCluster, setSelectedCluster] = useState<
      google.maps.Marker[] | null
    >(null);

    const memoizedSessions = useMemo(() => sessions, [sessions]);

    const centerMapOnMarker = useCallback(
      (position: LatLngLiteral) => {
        if (map && selectedStreamId) {
          map.setCenter(position);
          map.setZoom(ZOOM_FOR_SELECTED_SESSION);
        }
      },
      [map, selectedStreamId]
    );

    const handleBoundsChanged = useCallback(() => {
      if (selectedCluster && map) {
        const clusterCenter = selectedCluster.reduce(
          (acc, marker) => {
            const pos = marker.getPosition();
            if (pos) {
              acc.lat += pos.lat();
              acc.lng += pos.lng();
            }
            return acc;
          },
          { lat: 0, lng: 0 }
        );
        clusterCenter.lat /= selectedCluster.length;
        clusterCenter.lng /= selectedCluster.length;

        const clusterCenterLatLng = new google.maps.LatLng(
          clusterCenter.lat,
          clusterCenter.lng
        );
        const pixelPosition = getClusterPixelPosition(map, clusterCenterLatLng);
        setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      }
    }, [map, selectedCluster]);

    const handleClusterClick = useCallback(
      (cluster: Cluster) => {
        dispatch(setVisibility(false));

        const markers = cluster.markers as google.maps.Marker[];
        const streamIds = markers
          .map((marker) => marker.get("streamId"))
          .filter(Boolean);

        if (streamIds.length > 0) {
          dispatch(fetchClusterData(streamIds));
        }

        const clusterCenter = markers.reduce(
          (acc, marker) => {
            const pos = marker.getPosition();
            if (pos) {
              acc.lat += pos.lat();
              acc.lng += pos.lng();
            }
            return acc;
          },
          { lat: 0, lng: 0 }
        );
        clusterCenter.lat /= markers.length;
        clusterCenter.lng /= markers.length;

        const clusterCenterLatLng = new google.maps.LatLng(
          clusterCenter.lat,
          clusterCenter.lng
        );
        const pixelPosition = getClusterPixelPosition(
          map!,
          clusterCenterLatLng
        );
        setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
        setSelectedCluster(markers);
        dispatch(setVisibility(true));
      },
      [dispatch, map]
    );

    const handleMapInteraction = useCallback(() => {
      dispatch(setVisibility(false));
      setSelectedCluster(null);
      setClusterPosition(null);
    }, [dispatch]);

    const handleZoomIn = useCallback(() => {
      if (map && selectedCluster) {
        const bounds = new google.maps.LatLngBounds();
        selectedCluster.forEach((marker) => {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        });
        map.fitBounds(bounds);
        handleMapInteraction();
      }
    }, [map, selectedCluster, handleMapInteraction]);

    const createMarker = useCallback(
      (session: Session) => {
        if (!map) return null;

        const marker = new google.maps.Marker({
          position: session.point,
          map: map,
          icon: createMarkerIcon(
            getColorForValue(thresholds, session.lastMeasurementValue),
            `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
            session.point.streamId === selectedStreamId?.toString(),
            session.id === pulsatingSessionId
          ),
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1,
        });

        marker.set("streamId", session.point.streamId);
        marker.set("value", session.lastMeasurementValue);

        marker.addListener("click", () => {
          onMarkerClick(Number(session.point.streamId), Number(session.id));
          centerMapOnMarker(session.point);
        });

        return marker;
      },
      [
        map,
        thresholds,
        unitSymbol,
        selectedStreamId,
        pulsatingSessionId,
        onMarkerClick,
        centerMapOnMarker,
      ]
    );

    useEffect(() => {
      memoizedSessions.forEach((session) => {
        const existingMarker = markersRef.current[session.point.streamId];
        if (existingMarker) {
          existingMarker.setIcon(
            createMarkerIcon(
              getColorForValue(thresholds, session.lastMeasurementValue),
              `${Math.round(session.lastMeasurementValue)} ${unitSymbol}`,
              session.point.streamId === selectedStreamId?.toString(),
              session.id === pulsatingSessionId
            )
          );
        } else {
          const newMarker = createMarker(session);
          if (newMarker) {
            markersRef.current[session.point.streamId] = newMarker;
          }
        }
      });

      // Remove markers that are no longer in the sessions
      Object.keys(markersRef.current).forEach((streamId) => {
        if (
          !memoizedSessions.some(
            (session) => session.point.streamId === streamId
          )
        ) {
          markersRef.current[streamId].setMap(null);
          delete markersRef.current[streamId];
        }
      });

      if (clusterer.current) {
        clusterer.current.clearMarkers();
        clusterer.current.addMarkers(Object.values(markersRef.current));
      }
    }, [
      memoizedSessions,
      createMarker,
      thresholds,
      unitSymbol,
      selectedStreamId,
      pulsatingSessionId,
    ]);

    useEffect(() => {
      if (map && !clusterer.current) {
        clusterer.current = new MarkerClusterer({
          map,
          markers: Object.values(markersRef.current),
          renderer: customRenderer(thresholds, selectedStreamId),
        });

        clusterer.current.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            const cluster = (event as any).get("cluster"); // Type assertion to access get method
            if (cluster) {
              handleClusterClick(cluster);
            }
          }
        );
      }
    }, [map, handleClusterClick, thresholds, selectedStreamId]);

    useEffect(() => {
      const handleSelectedStreamId = (streamId: number | null) => {
        if (!streamId || fixedStreamStatus === StatusEnum.Pending) return;
        const { latitude, longitude } = fixedStreamData.stream;

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
    }, [
      selectedStreamId,
      fixedStreamData,
      fixedStreamStatus,
      centerMapOnMarker,
    ]);

    useEffect(() => {
      dispatch(setMarkersLoading(true));
    }, [dispatch, sessions.length]);

    useEffect(() => {
      if (Object.keys(markersRef.current).length >= sessions.length) {
        dispatch(setMarkersLoading(false));
      }
    }, [dispatch, sessions.length]);

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

    useMapEventListeners(map, {
      click: handleMapInteraction,
      zoom_changed: handleMapInteraction,
      dragstart: handleMapInteraction,
      bounds_changed: handleBoundsChanged,
    });

    return (
      <>
        {hoverPosition && <HoverMarker position={hoverPosition} />}
        {selectedCluster &&
          clusterPosition &&
          !clusterLoading &&
          clusterData && (
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
);

export { FixedMarkers };
