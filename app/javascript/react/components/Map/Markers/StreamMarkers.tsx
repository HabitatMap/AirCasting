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
import { selectHoverPosition, setHoverPosition } from "../../../store/mapSlice";
import {
  setMarkersLoading,
  setTotalMarkers,
} from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { MobileSession } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import { CustomMarker } from "./CustomOverlays/CustomMarker";
import HoverMarker from "./HoverMarker/HoverMarker";

type Props = {
  sessions: MobileSession[];
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
  const isInitialLoading = useRef(true);

  const sortedSessions = useMemo(() => {
    console.time("sortedSessions calculation");
    const validSessions = sessions.filter(
      (session) =>
        session.point &&
        typeof session.point.lat === "number" &&
        typeof session.point.lng === "number"
    );

    const locationMap = new Map<string, MobileSession>();
    validSessions.forEach((session) => {
      const locationKey = `${session.point.lat},${session.point.lng}`;
      const existingSession = locationMap.get(locationKey);

      if (
        !existingSession ||
        (session.time &&
          existingSession.time &&
          new Date(session.time.toString()) >
            new Date(existingSession.time.toString()))
      ) {
        locationMap.set(locationKey, session);
      }
    });

    const sorted = Array.from(locationMap.values()).sort((a, b) => {
      const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
      const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
      return timeA - timeB;
    });
    console.timeEnd("sortedSessions calculation");
    return sorted;
  }, [sessions]);

  const handleIdle = useCallback(() => {
    dispatch(setMarkersLoading(false));
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, [dispatch]);

  const firstSessionWithNotes = useMemo(() => {
    return sortedSessions.find(
      (session) => session.notes && session.notes?.length > 0
    );
  }, [sortedSessions]);

  const createOrUpdateMarker = useCallback(
    (session: MobileSession) => {
      if (!CustomOverlay) return;

      const markerId = session.id.toString();
      const position = { lat: session.point.lat, lng: session.point.lng };
      const title = `${session.lastMeasurementValue} ${unitSymbol}`;

      const shouldShowNotes =
        firstSessionWithNotes &&
        session.point.lat === firstSessionWithNotes.point.lat &&
        session.point.lng === firstSessionWithNotes.point.lng;
      const notes = shouldShowNotes ? session.notes || [] : [];

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
          20,
          "overlayMouseTarget",
          notes
        );
        marker.setMap(map);
        markersRef.current.set(markerId, marker);
      } else {
        marker.setPosition(position);
        marker.setTitle(title);
        marker.setNotes(notes);

        if (marker.getMap() !== map) {
          marker.setMap(map);
        }
      }

      return marker;
    },
    [map, unitSymbol, CustomOverlay, firstSessionWithNotes, thresholds]
  );

  useEffect(() => {
    if (window.google && window.google.maps && !CustomOverlay) {
      setCustomOverlay(() => CustomMarker);
    }
  }, [CustomOverlay]);

  useEffect(() => {
    if (!map || !CustomOverlay) return;

    console.time("markers-update-effect");
    dispatch(setMarkersLoading(true));
    isInitialLoading.current = true;

    // Calculate bounds to find center
    const bounds = new google.maps.LatLngBounds();
    sortedSessions.forEach((session) => {
      bounds.extend({ lat: session.point.lat, lng: session.point.lng });
    });

    // Extend bounds to show more context around markers
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latPadding = (ne.lat() - sw.lat()) * 0.4;
    const lngPadding = (ne.lng() - sw.lng()) * 0.4;

    bounds.extend({
      lat: ne.lat() + latPadding * 0.1, // Minimal north padding
      lng: ne.lng() + lngPadding,
    });
    bounds.extend({
      lat: sw.lat() - latPadding * 2.5, // Much more south padding
      lng: sw.lng() - lngPadding,
    });

    // Fit bounds with padding
    map.fitBounds(bounds);

    // After bounds are set, create markers
    const activeMarkerIds = new Set<string>();

    console.time("markers-update");
    sortedSessions.forEach((session) => {
      const markerId = session.id.toString();
      createOrUpdateMarker(session);
      activeMarkerIds.add(markerId);
    });
    console.timeEnd("markers-update");

    // Update polyline
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    if (polylineRef.current) {
      polylineRef.current.setPath(path);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    // Clean up unused markers
    markersRef.current.forEach((marker, markerId) => {
      if (!activeMarkerIds.has(markerId)) {
        marker.setMap(null);
        markersRef.current.delete(markerId);
      }
    });

    dispatch(setTotalMarkers(sortedSessions.length));
    dispatch(setMarkersLoading(false));
    isInitialLoading.current = false;
    const idleListener = map.addListener("idle", handleIdle);
    console.timeEnd("markers-update-effect");

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      dispatch(setHoverPosition(null));
      google.maps.event.removeListener(idleListener);
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

  return !isInitialLoading.current && hoverPosition ? (
    <HoverMarker position={hoverPosition} />
  ) : null;
};

export { StreamMarkers };
