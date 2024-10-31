import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";

import { mobileStreamPath } from "../../../assets/styles/colors";
import { useAppDispatch } from "../../../store/hooks";
import { selectHoverPosition } from "../../../store/mapSlice";
import { setMarkersLoading } from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import { CustomMarker } from "./CustomMarker";
import HoverMarker from "./HoverMarker/HoverMarker";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
  const dispatch = useAppDispatch();
  const map = useMap();
  const markersRef = useRef<Map<string, CustomMarker>>(new Map());
  const thresholds = useSelector(selectThresholds);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hoverPosition = useSelector(selectHoverPosition);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [CustomOverlay, setCustomOverlay] = useState<
    typeof CustomMarker | null
  >(null);

  const sortedSessions = useMemo(() => {
    return [...sessions]
      .filter(
        (session) =>
          session.point &&
          typeof session.point.lat === "number" &&
          typeof session.point.lng === "number"
      )
      .sort((a, b) => {
        const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
        const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
        return timeA - timeB;
      });
  }, [sessions]);

  const handleIdle = useCallback(() => {
    dispatch(setMarkersLoading(false));
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, [dispatch]);

  const createOrUpdateMarker = useCallback(
    (session: Session) => {
      if (!CustomOverlay) return;

      const position = { lat: session.point.lat, lng: session.point.lng };
      const markerId = session.id.toString();
      const title = `${session.lastMeasurementValue} ${unitSymbol}`;
      const notes =
        session.notes?.map((note) => ({
          id: note.id.toString(),
          latitude: note.latitude,
          longitude: note.longitude,
          text: note.text,
          date: note.date,
        })) || [];

      let marker = markersRef.current.get(markerId);
      if (!marker) {
        const color = getColorForValue(
          thresholds,
          session.lastMeasurementValue
        );
        marker = new CustomOverlay(
          position,
          color,
          title,
          12,
          undefined,
          undefined,
          20,
          "overlayMouseTarget",
          // onNoteClick,
          notes
        );
        marker.setMap(map);
        markersRef.current.set(markerId, marker);
      } else {
        marker.setPosition(position);
        marker.setTitle(title);
        if (JSON.stringify(marker.getNotes()) !== JSON.stringify(notes)) {
          marker.setNotes(notes);
        }
        // marker.setOnNoteClick(onNoteClick);
      }

      return marker;
    },
    [map, unitSymbol, CustomOverlay]
  );

  useEffect(() => {
    if (window.google && window.google.maps && !CustomOverlay) {
      setCustomOverlay(() => CustomMarker);
    }
  }, [CustomOverlay]);

  useEffect(() => {
    if (!map || !CustomOverlay) return;

    // dispatch(setMarkersLoading(true));
    // dispatch(setTotalMarkers(sortedSessions.length));

    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path: path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    const currentMarkerIds = new Set<string>();

    sortedSessions.forEach((session) => {
      const markerId = session.id.toString();
      createOrUpdateMarker(session);
      currentMarkerIds.add(markerId);
    });

    markersRef.current.forEach((marker, markerId) => {
      if (!currentMarkerIds.has(markerId)) {
        marker.setMap(null);
        markersRef.current.delete(markerId);
      }
    });

    const idleListener = map.addListener("idle", handleIdle);

    timeoutId.current = setTimeout(() => {
      dispatch(setMarkersLoading(false));
    }, 10000);

    return () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current.clear();

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      google.maps.event.removeListener(idleListener);
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    };
  }, [
    map,
    sortedSessions,
    dispatch,
    handleIdle,
    createOrUpdateMarker,
    CustomOverlay,
  ]);

  useEffect(() => {
    markersRef.current.forEach((marker, markerId) => {
      const session = sortedSessions.find((s) => s.id.toString() === markerId);

      if (session) {
        const newColor = getColorForValue(
          thresholds,
          session.lastMeasurementValue
        );
        marker.setColor(newColor);
      }
    });
  }, [thresholds, sortedSessions]);

  return hoverPosition ? <HoverMarker position={hoverPosition} /> : null;
};

export { StreamMarkers };
