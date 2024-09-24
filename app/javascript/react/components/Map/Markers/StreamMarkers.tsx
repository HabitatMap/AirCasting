// import { useMap } from "@vis.gl/react-google-maps";
// import React, { useEffect, useMemo, useRef } from "react";
// import { useSelector } from "react-redux";

// import { mobileStreamPath } from "../../../assets/styles/colors";
// import { useAppDispatch } from "../../../store/hooks";
// import { selectHoverPosition } from "../../../store/mapSlice";
// import {
//   setMarkersLoading,
//   setTotalMarkers,
// } from "../../../store/markersLoadingSlice";
// import { selectThresholds } from "../../../store/thresholdSlice";
// import { Session } from "../../../types/sessionType";
// import { getColorForValue } from "../../../utils/thresholdColors";
// import HoverMarker from "./HoverMarker/HoverMarker";

// type Props = {
//   sessions: Session[];
//   unitSymbol: string;
// };

// const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
//   const dispatch = useAppDispatch();
//   const map = useMap();
//   const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
//   const thresholds = useSelector(selectThresholds);
//   const polylineRef = useRef<google.maps.Polyline | null>(null);
//   const hoverPosition = useSelector(selectHoverPosition);

//   // Memoize the sorted sessions
//   const sortedSessions = useMemo(() => {
//     return [...sessions].sort((a, b) => {
//       const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
//       const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
//       return timeA - timeB;
//     });
//   }, [sessions]);

//   useEffect(() => {
//     if (!map) return;

//     dispatch(setMarkersLoading(true));
//     dispatch(setTotalMarkers(sessions.length));

//     // Remove existing markers
//     if (markersRef.current.length > 0) {
//       markersRef.current.forEach((marker) => {
//         marker.map = null;
//       });
//       markersRef.current = [];
//     }

//     // Create or update the polyline
//     const path = sortedSessions.map((session) => ({
//       lat: session.point.lat,
//       lng: session.point.lng,
//     }));

//     if (polylineRef.current) {
//       polylineRef.current.setPath(path);
//     } else {
//       polylineRef.current = new google.maps.Polyline({
//         path,
//         map,
//         strokeColor: mobileStreamPath,
//         strokeOpacity: 0.7,
//         strokeWeight: 4,
//       });
//     }

//     const markers = sortedSessions.map((session) => {
//       const position = { lat: session.point.lat, lng: session.point.lng };
//       const color = getColorForValue(thresholds, session.lastMeasurementValue);

//       // Create the element for the marker
//       const markerElement = document.createElement("div");
//       markerElement.style.width = "12px";
//       markerElement.style.height = "12px";
//       markerElement.style.borderRadius = "50%";
//       markerElement.style.backgroundColor = color;
//       markerElement.style.border = `1px solid ${color}`;

//       const marker = new google.maps.marker.AdvancedMarkerElement({
//         position,
//         content: markerElement,
//         title: `${session.lastMeasurementValue} ${unitSymbol}`,
//         zIndex: 0,
//         map: map,
//       });

//       return marker;
//     });

//     markersRef.current = markers;

//     dispatch(setMarkersLoading(false));

//     return () => {
//       // Remove markers
//       if (markersRef.current.length > 0) {
//         markersRef.current.forEach((marker) => {
//           marker.map = null;
//         });
//         markersRef.current = [];
//       }

//       // Remove polyline
//       if (polylineRef.current) {
//         polylineRef.current.setMap(null);
//         polylineRef.current = null;
//       }
//     };
//   }, [map, sortedSessions, thresholds, unitSymbol, dispatch]);

//   return hoverPosition ? <HoverMarker position={hoverPosition} /> : null;
// };

// export { StreamMarkers };

// StreamMarkers.tsx
// StreamMarkers.tsx
// StreamMarkers.tsx
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

import { mobileStreamPath } from "../../../assets/styles/colors";
import { useAppDispatch } from "../../../store/hooks";
import { selectHoverPosition } from "../../../store/mapSlice";
import {
  selectLoadedMarkers,
  selectTotalMarkers,
  setMarkersLoading,
  setTotalMarkers,
} from "../../../store/markersLoadingSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";
import HoverMarker from "./HoverMarker/HoverMarker";
import { StreamMarker } from "./StreamMarker/StreamMarker";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
  const dispatch = useAppDispatch();
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const thresholds = useSelector(selectThresholds);
  const hoverPosition = useSelector(selectHoverPosition);
  const loadedMarkers = useSelector(selectLoadedMarkers);
  const totalMarkers = useSelector(selectTotalMarkers);

  // Memoize the sorted sessions to prevent unnecessary recalculations
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = a.time ? new Date(a.time.toString()).getTime() : 0;
      const timeB = b.time ? new Date(b.time.toString()).getTime() : 0;
      return timeA - timeB;
    });
  }, [sessions]);

  // Initialize markers loading and polyline
  useEffect(() => {
    if (!map) return;

    // Start loading
    dispatch(setMarkersLoading(true));
    dispatch(setTotalMarkers(sessions.length));

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (sortedSessions.length === 0) {
      // No markers to display
      dispatch(setMarkersLoading(false));
      return;
    }

    // Create polyline
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    polylineRef.current = new google.maps.Polyline({
      path,
      map,
      strokeColor: mobileStreamPath,
      strokeOpacity: 0.7,
      strokeWeight: 4,
      zIndex: 1, // Ensure polyline is below markers
    });

    // Cleanup function
    return () => {
      // Remove polyline from the map
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, sortedSessions, dispatch, sessions.length]);

  // Monitor loaded markers and update loading state
  useEffect(() => {
    if (totalMarkers > 0 && loadedMarkers >= totalMarkers) {
      dispatch(setMarkersLoading(false));
    }
  }, [loadedMarkers, totalMarkers, dispatch]);

  return (
    <>
      {sortedSessions.map((session) => (
        <React.Fragment key={session.id}>
          <AdvancedMarker
            title={`${session.lastMeasurementValue} ${unitSymbol}`}
            position={session.point}
            zIndex={0}
          >
            <StreamMarker
              color={getColorForValue(thresholds, session.lastMeasurementValue)}
            />
          </AdvancedMarker>
        </React.Fragment>
      ))}
      {hoverPosition && <HoverMarker position={hoverPosition} />}
    </>
  );
};

export { StreamMarkers };
