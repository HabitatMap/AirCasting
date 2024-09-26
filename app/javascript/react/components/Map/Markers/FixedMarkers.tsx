import {
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
import { fetchClusterData } from "../../../store/clusterSlice";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterInfo } from "./ClusterInfo/ClusterInfo";
import HoverMarker from "./HoverMarker/HoverMarker";

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
  const dispatch = useAppDispatch();
  const map = useMap();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const thresholds = useAppSelector(selectThresholds);
  const markerRefs = useRef<{ [streamId: string]: google.maps.Marker | null }>(
    {}
  );
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [hoverPosition, setHoverPosition] = useState<google.maps.LatLng | null>(
    null
  );
  const [clusterPosition, setClusterPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  const sortedSessions = useMemo(() => {
    return sessions.filter(
      (session) => session.point && session.point.lat && session.point.lng
    );
  }, [sessions]);

  const createMarker = useCallback(
    (session: Session) => {
      const position = { lat: session.point.lat, lng: session.point.lng };
      const color = getColorForValue(thresholds, session.lastMeasurementValue);

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${session.lastMeasurementValue}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        onMarkerClick(Number(session.point.streamId), Number(session.id));
      });

      return marker;
    },
    [onMarkerClick, thresholds]
  );

  useEffect(() => {
    if (!map) return;

    dispatch(setMarkersLoading(true));

    // Remove existing markers
    Object.values(markerRefs.current).forEach((marker) => {
      if (marker) marker.setMap(null);
    });

    // Create new markers
    const markers = sortedSessions.map((session) => {
      const marker = createMarker(session);
      markerRefs.current[session.point.streamId] = marker;
      return marker;
    });

    // Create or update marker clusterer
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({
        map,
        markers,
        algorithm: new SuperClusterAlgorithm({ radius: 40 }),
        onClusterClick: (event, cluster, map) => {
          const streamIds = cluster.markers
            .map((marker) => markerRefs.current[marker.getTitle()])
            .filter(Boolean)
            .map((markerRef) => markerRef.point.streamId);
          dispatch(fetchClusterData(streamIds));

          setSelectedCluster(cluster);
        },
      });
    } else {
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(markers);
    }

    dispatch(setMarkersLoading(false));

    return () => {
      markers.forEach((marker) => marker.setMap(null));
      if (clusterer.current) clusterer.current.clearMarkers();
    };
  }, [map, sortedSessions, createMarker, dispatch]);

  useEffect(() => {
    if (hoverStreamId) {
      const hoveredSession = sortedSessions.find(
        (session) => session.point.streamId === hoverStreamId
      );
      if (hoveredSession)
        setHoverPosition(
          new google.maps.LatLng(
            hoveredSession.point.lat,
            hoveredSession.point.lng
          )
        );
    } else {
      setHoverPosition(null);
    }
  }, [hoverStreamId, sortedSessions]);

  const handleBoundsChanged = useCallback(() => {
    if (selectedCluster && map) {
      const projection = map.getProjection();
      if (projection) {
        const position = selectedCluster.position;
        const pixelPosition = projection.fromLatLngToPoint(position) as {
          x: number;
          y: number;
        };
        setClusterPosition({ top: pixelPosition.y, left: pixelPosition.x });
      }
    }
  }, [map, selectedCluster]);

  return (
    <>
      {hoverPosition && (
        <HoverMarker
          position={{ lat: hoverPosition.lat(), lng: hoverPosition.lng() }}
        />
      )}
      {selectedCluster && clusterPosition && (
        <ClusterInfo
          average={50}
          handleZoomIn={() => map && map.setZoom(map.getZoom()! + 1)}
          position={clusterPosition}
          color={""}
          numberOfSessions={0}
          visible={false}
        />
      )}
    </>
  );
};

export { FixedMarkers };
