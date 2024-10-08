import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useMap } from "@vis.gl/react-google-maps";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectHoverStreamId } from "../../../store/mapSlice";
import { Session } from "../../../types/sessionType";
import HoverMarker from "./HoverMarker/HoverMarker";

import { gray300 } from "../../../assets/styles/colors";
import {
  selectFixedStreamData,
  selectFixedStreamStatus,
} from "../../../store/fixedStreamSelectors";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { StatusEnum } from "../../../types/api";
import type { LatLngLiteral } from "../../../types/googleMaps";

type CustomMarker = google.maps.Marker & {
  value: number;
  sessionId: number;
  userData: { streamId: string };
};

type DormantMarkersProps = {
  sessions: Session[];
  onMarkerClick: (streamId: number | null, id: number | null) => void;
  selectedStreamId: number | null;
  pulsatingSessionId: number | null;
};

const DormantMarkers = ({
  sessions,
  onMarkerClick,
  selectedStreamId,
  pulsatingSessionId,
}: DormantMarkersProps) => {
  const ZOOM_FOR_SELECTED_SESSION = 15;

  const dispatch = useAppDispatch();
  const hoverStreamId = useAppSelector(selectHoverStreamId);
  const fixedStreamStatus = useAppSelector(selectFixedStreamStatus);
  const fixedStreamData = useAppSelector(selectFixedStreamData);
  const markerRefs = useRef<Map<string, CustomMarker>>(new Map());

  const map = useMap();

  const [hoverPosition, setHoverPosition] = useState<LatLngLiteral | null>(
    null
  );

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

  const createMarkerIcon = useCallback(() => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: gray300,
      fillOpacity: 1,
      strokeWeight: 0,
      scale: 6,
    };
  }, []);

  const createMarker = useCallback(
    (session: Session): CustomMarker => {
      const marker = new google.maps.Marker({
        position: session.point,
        icon: createMarkerIcon(),
        zIndex: 0,
        map: map,
      }) as CustomMarker;

      marker.addListener("click", () => {
        onMarkerClick(Number(session.point.streamId), Number(session.id));
        centerMapOnMarker(session.point);
      });
      return marker;
    },
    [
      map,
      sessions,
      selectedStreamId,
      pulsatingSessionId,
      onMarkerClick,
      centerMapOnMarker,
    ]
  );

  useEffect(() => {
    if (!map) return;

    sessions.forEach((session) => {
      let marker = markerRefs.current.get(session.point.streamId);
      if (!marker) {
        marker = createMarker(session);
        markerRefs.current.set(session.point.streamId, marker);
      } else {
        const newIcon = createMarkerIcon();

        // Update existing marker
        marker.setIcon(newIcon);
        marker.setPosition(session.point);
        marker.value = session.lastMeasurementValue;
        marker.sessionId = session.id;
      }
    });
  }, [sessions, map, createMarker, selectedStreamId, pulsatingSessionId]);

  useEffect(() => {
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current.clear();
    };
  }, []);

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
    if (markerRefs.current.size >= sessions.length) {
      dispatch(setMarkersLoading(false));
    }
  }, [dispatch, sessions.length]);

  return hoverPosition && <HoverMarker position={hoverPosition} />;
};

export { DormantMarkers };
