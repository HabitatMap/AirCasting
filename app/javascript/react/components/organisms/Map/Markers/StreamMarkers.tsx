import { useMap } from "@vis.gl/react-google-maps";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { mobileStreamPath } from "../../../../assets/styles/colors";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import {
  selectHoverPosition,
  setHoverPosition,
} from "../../../../store/mapSlice";
import {
  setMarkersLoading,
  setTotalMarkers,
} from "../../../../store/markersLoadingSlice";
import { selectMobileStreamData } from "../../../../store/mobileStreamSelectors";
import { selectThresholds } from "../../../../store/thresholdSlice";
import { Note } from "../../../../types/note";
import { MobileSession } from "../../../../types/sessionType";
import { getColorForValue } from "../../../../utils/thresholdColors";
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
  const thresholds = useAppSelector(selectThresholds);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hoverPosition = useAppSelector(selectHoverPosition);
  const mobileStreamData = useAppSelector(selectMobileStreamData);
  const [CustomOverlay, setCustomOverlay] = useState<
    typeof CustomMarker | null
  >(null);
  const isInitialLoading = useRef(true);

  const ZOOM_FOR_SELECTED_SESSION = 16;
  const LAT_DIFF_SMALL = 0.00001;
  const LAT_DIFF_MEDIUM = 0.0001;
  const LAT_ADJUST_SMALL = 0.005;

  const sortedSessions = useMemo(() => {
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
    return sorted;
  }, [sessions]);

  const handleIdle = useCallback(() => {
    dispatch(setMarkersLoading(false));
  }, [dispatch]);

  const createOrUpdateMarker = useCallback(
    (session: MobileSession, allNotes: Note[]) => {
      if (!CustomOverlay) return;

      const markerId = session.id.toString();
      const position = { lat: session.point.lat, lng: session.point.lng };
      const title = `${session.lastMeasurementValue} ${unitSymbol}`;

      const notesForThisMarker = allNotes.filter(
        (note) =>
          note.latitude != null &&
          note.longitude != null &&
          note.latitude === position.lat &&
          note.longitude === position.lng
      );

      const sessionNotes =
        notesForThisMarker.length > 0 ? session.notes || [] : [];

      const combinedNotes = [...notesForThisMarker];
      sessionNotes.forEach((note) => {
        if (
          !combinedNotes.some((existingNote) => existingNote.id === note.id)
        ) {
          combinedNotes.push(note);
        }
      });

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
          combinedNotes
        );
        marker.setMap(map);
        markersRef.current.set(markerId, marker);
      } else {
        marker.setPosition(position);
        marker.setTitle(title);
        marker.setNotes(combinedNotes);

        if (marker.getMap() !== map) {
          marker.setMap(map);
        }
      }

      return marker;
    },
    [map, unitSymbol, CustomOverlay, thresholds]
  );

  useEffect(() => {
    if (window.google && window.google.maps && !CustomOverlay) {
      setCustomOverlay(() => CustomMarker);
    }
  }, [CustomOverlay]);

  const centerMapOnBounds = useCallback(
    (bounds: google.maps.LatLngBounds) => {
      if (!map) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat() - sw.lat();
      const lngDiff = ne.lng() - sw.lng();

      if (latDiff < LAT_DIFF_SMALL && lngDiff < LAT_DIFF_SMALL) {
        const centerLat = (ne.lat() + sw.lat()) / 2;
        const centerLng = (ne.lng() + sw.lng()) / 2;
        map.setCenter({ lat: centerLat, lng: centerLng });
        map.setZoom(ZOOM_FOR_SELECTED_SESSION);
      } else {
        let adjustedLat: number;
        if (latDiff >= 0 && latDiff < LAT_DIFF_SMALL) {
          adjustedLat = sw.lat() - LAT_ADJUST_SMALL;
        } else if (latDiff >= LAT_DIFF_SMALL && latDiff < LAT_DIFF_MEDIUM) {
          adjustedLat = sw.lat() - latDiff * 2;
        } else {
          adjustedLat = sw.lat() - latDiff;
        }

        const adjustedBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(adjustedLat, sw.lng()),
          new google.maps.LatLng(ne.lat(), ne.lng())
        );

        map.fitBounds(adjustedBounds);

        if (latDiff === 0) {
          map.setZoom(ZOOM_FOR_SELECTED_SESSION);
        }
      }
    },
    [map]
  );

  useEffect(() => {
    if (!map || !CustomOverlay) return;

    const cleanup = () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
        marker.cleanup();
      });
      markersRef.current.clear();

      // Cleanup for invisible note markers
      if (noteMarkersRef.current) {
        noteMarkersRef.current.forEach((marker) => {
          marker.setMap(null);
          marker.cleanup();
        });
        noteMarkersRef.current.clear();
      }

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };

    // Always clean up before setting new markers
    cleanup();

    dispatch(setMarkersLoading(true));
    isInitialLoading.current = true;

    if (sessions.length === 0) {
      dispatch(setMarkersLoading(false));
      return cleanup;
    }

    requestAnimationFrame(() => {
      const activeMarkerIds = new Set<string>();
      const allNotesForStream = mobileStreamData.notes || [];

      // Track all visible marker locations
      const markerLocations = new Set<string>();

      sortedSessions.forEach((session) => {
        const markerId = session.id.toString();
        createOrUpdateMarker(session, allNotesForStream);
        activeMarkerIds.add(markerId);
        markerLocations.add(`${session.point.lat},${session.point.lng}`);
      });

      // Create invisible markers for notes without a session marker at their location
      if (!noteMarkersRef.current) noteMarkersRef.current = new Map();
      allNotesForStream.forEach((note) => {
        const key = `${note.latitude},${note.longitude}`;
        if (!markerLocations.has(key)) {
          const noteMarkerId = `note-invisible-${note.id}`;
          let noteMarker = noteMarkersRef.current.get(noteMarkerId);
          if (!noteMarker) {
            noteMarker = new CustomOverlay(
              { lat: note.latitude, lng: note.longitude },
              "", // no color needed
              "", // no title needed
              12,
              20,
              "overlayMouseTarget",
              [note],
              undefined,
              undefined,
              true // invisible
            );
            noteMarker.setMap(map);
            noteMarkersRef.current.set(noteMarkerId, noteMarker);
          } else {
            noteMarker.setPosition({ lat: note.latitude, lng: note.longitude });
            noteMarker.setNotes([note]);
            if (noteMarker.getMap() !== map) {
              noteMarker.setMap(map);
            }
          }
        }
      });

      // Cleanup stale invisible note markers
      noteMarkersRef.current.forEach((marker, markerId) => {
        const noteId = markerId.replace("note-invisible-", "");
        const note = allNotesForStream.find((n) => n.id.toString() === noteId);
        const key = note ? `${note.latitude},${note.longitude}` : null;
        if (!note || (key !== null && markerLocations.has(key))) {
          marker.setMap(null);
          marker.cleanup();
          noteMarkersRef.current.delete(markerId);
        }
      });

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

      markersRef.current.forEach((marker, markerId) => {
        if (!activeMarkerIds.has(markerId)) {
          marker.setMap(null);
          markersRef.current.delete(markerId);
        }
      });

      dispatch(setTotalMarkers(sortedSessions.length));
      dispatch(setMarkersLoading(false));
      isInitialLoading.current = false;

      dispatch(setHoverPosition(null));
    });

    return cleanup;
  }, [
    map,
    sortedSessions,
    sessions,
    dispatch,
    handleIdle,
    createOrUpdateMarker,
    CustomOverlay,
    centerMapOnBounds,
    mobileStreamData.notes,
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

  // Add a ref for invisible note markers
  const noteMarkersRef = React.useRef<Map<string, CustomMarker>>(new Map());

  return !isInitialLoading.current && hoverPosition ? (
    <HoverMarker position={hoverPosition} />
  ) : null;
};

export { StreamMarkers };
