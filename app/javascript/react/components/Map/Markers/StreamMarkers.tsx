import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

import { Marker } from "@googlemaps/markerclusterer";
import { mobileStreamPath } from "../../../assets/styles/colors";
import { useAppDispatch } from "../../../store/hooks";
import {
  setMarkersLoading,
  setTotalMarkers,
} from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import { StreamMarker } from "./StreamMarker/StreamMarker";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
  const dispatch = useAppDispatch();
  const map = useMap();
  const markersRef = useRef<{ [streamId: string]: Marker | null }>({});
  const thresholds = useSelector(selectThresholds);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Sort sessions by time without mutating the original array
  const sortedSessions = useMemo(
    () =>
      sessions.slice().sort((a, b) => {
        const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
        const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
        return timeA - timeB;
      }),
    [sessions]
  );

  useEffect(() => {
    dispatch(setMarkersLoading(true));
    dispatch(setTotalMarkers(sessions.length));
  }, [dispatch, sessions.length]);

  // Memoize the path
  const path = useMemo(() => {
    return sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));
  }, [sortedSessions]);

  // Debounce the path updates
  const debouncedPath = useDebounce(path, 300);

  // Create and update polyline
  useEffect(() => {
    if (!map || !debouncedPath.length) return;

    if (polylineRef.current) {
      polylineRef.current.setPath(debouncedPath);
    } else {
      polylineRef.current = new google.maps.Polyline({
        path: debouncedPath,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    // Cleanup function to remove the polyline
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [debouncedPath, map]);

  return (
    <>
      {sessions.map((session) => (
        <AdvancedMarker
          title={`${session.lastMeasurementValue} ${unitSymbol}`}
          position={session.point}
          key={`marker-${session.id}`}
          zIndex={0}
          ref={(marker) => {
            if (marker && !markersRef.current[session.point.streamId]) {
              markersRef.current[session.point.streamId] = marker;
            }
          }}
        >
          <StreamMarker
            color={getColorForValue(thresholds, session.lastMeasurementValue)}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { StreamMarkers };
