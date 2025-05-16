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
import store from "../../../../store/index";
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

  /**
   * Creates or updates a marker for a given session
   * @param session - The mobile session to create a marker for
   * @param map - The Google Maps instance
   * @param CustomOverlay - The custom marker overlay class
   * @param thresholds - The threshold values for coloring
   * @param unitSymbol - The unit symbol to display
   * @param markersRef - Reference to the markers map
   * @returns The created or updated marker
   */
  const createOrUpdateMarker = (
    session: MobileSession,
    map: google.maps.Map,
    CustomOverlay: typeof CustomMarker,
    thresholds: any,
    unitSymbol: string,
    markersRef: React.MutableRefObject<Map<string, CustomMarker>>
  ) => {
    const markerId = session.id.toString();
    const position = { lat: session.point.lat, lng: session.point.lng };
    const title = `${session.lastMeasurementValue} ${unitSymbol}`;

    let marker = markersRef.current.get(markerId);

    if (!marker) {
      const color = getColorForValue(thresholds, session.lastMeasurementValue);
      marker = new CustomOverlay(
        position,
        color,
        title,
        12,
        20,
        "overlayMouseTarget",
        []
      );
      marker.setMap(map);
      markersRef.current.set(markerId, marker);
    } else {
      marker.setPosition(position);
      marker.setTitle(title);
      marker.setNotes([]);
      if (marker.getMap() !== map) {
        marker.setMap(map);
      }
    }

    return marker;
  };

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

    cleanup();

    dispatch(setMarkersLoading(true));
    isInitialLoading.current = true;

    if (sessions.length === 0) {
      dispatch(setMarkersLoading(false));
      return cleanup;
    }

    if (sortedSessions.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      sortedSessions.forEach((session) => {
        bounds.extend({ lat: session.point.lat, lng: session.point.lng });
      });
      centerMapOnBounds(bounds);
    }

    requestAnimationFrame(() => {
      const allNotesForStream = mobileStreamData.notes || [];
      const markerLocations = new Set<string>();

      // Create markers for sessions
      sortedSessions.forEach((session) => {
        createOrUpdateMarker(
          session,
          map,
          CustomOverlay,
          thresholds,
          unitSymbol,
          markersRef
        );
        markerLocations.add(`${session.point.lat},${session.point.lng}`);
      });

      // Create invisible markers for each note location, each with all notes for the session
      if (!noteMarkersRef.current) noteMarkersRef.current = new Map();

      // Group notes by location
      const notesByLocation = new Map<string, Note[]>();
      allNotesForStream.forEach((note) => {
        const key = `${note.latitude},${note.longitude}`;
        if (!notesByLocation.has(key)) {
          notesByLocation.set(key, []);
        }
        notesByLocation.get(key)?.push(note);
      });

      // Sort all notes by date for consistent navigation order
      const allNotesSorted = [...allNotesForStream].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create markers at each note location with only the notes at that location
      notesByLocation.forEach((locationNotes, locationKey) => {
        const [lat, lng] = locationKey.split(",").map(Number);
        const noteMarkerId = `note-${locationKey}`;
        let noteMarker = noteMarkersRef.current.get(noteMarkerId);

        const initialSlideInGlobal = allNotesSorted.findIndex(
          (note) => note.latitude === lat && note.longitude === lng
        );

        if (!noteMarker) {
          noteMarker = new CustomOverlay(
            { lat, lng },
            "", // no color needed
            "", // no title needed
            12, // size
            20, // clickable area size
            "overlayMouseTarget", // pane name
            allNotesSorted, // notes array
            undefined, // content
            undefined, // onClick
            false // invisible
          );
          // Set initial slide separately since we can't pass it in the constructor
          if (noteMarker) {
            noteMarker.setNotes(allNotesSorted, initialSlideInGlobal);
          }
          noteMarker.setMap(map);
          noteMarkersRef.current.set(noteMarkerId, noteMarker);
        } else {
          noteMarker.setPosition({ lat, lng });
          noteMarker.setNotes(allNotesSorted, initialSlideInGlobal);
          if (noteMarker.getMap() !== map) {
            noteMarker.setMap(map);
          }
        }
      });

      // Cleanup stale markers
      noteMarkersRef.current.forEach((marker, markerId) => {
        if (markerId.startsWith("note-")) {
          const locationKey = markerId.replace("note-", "");
          if (!notesByLocation.has(locationKey)) {
            marker.setMap(null);
            marker.cleanup();
            noteMarkersRef.current.delete(markerId);
          }
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
        if (
          !sortedSessions.some((session) => session.id.toString() === markerId)
        ) {
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

  const noteMarkersRef = React.useRef<Map<string, CustomMarker>>(new Map());

  // Add Redux subscription to update all marker popovers
  React.useEffect(() => {
    let lastOpenMarkerKey: string | null = null;
    let lastInitialSlide: number | null = null;

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const openMarkerKey = state.popover.openMarkerKey;
      const initialSlide = state.popover.initialSlide;

      if (
        openMarkerKey !== lastOpenMarkerKey ||
        initialSlide !== lastInitialSlide
      ) {
        lastOpenMarkerKey = openMarkerKey;
        lastInitialSlide = initialSlide;

        if (map && (map as any).__customMarkers) {
          (map as any).__customMarkers.forEach((marker: CustomMarker) => {
            marker.setNotes(marker.getNotes(), initialSlide);
          });
        }
      }
    });

    return () => unsubscribe();
  }, [map]);

  return !isInitialLoading.current && hoverPosition ? (
    <HoverMarker position={hoverPosition} />
  ) : null;
};

export { StreamMarkers };
