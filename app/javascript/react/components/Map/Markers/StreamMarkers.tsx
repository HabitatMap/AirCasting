// import { useMap } from "@vis.gl/react-google-maps";
// import { useEffect, useMemo, useRef } from "react";
// import { useSelector } from "react-redux";

// import { mobileStreamPath } from "../../../assets/styles/colors";
// import { useAppDispatch } from "../../../store/hooks";
// import { selectThresholds } from "../../../store/thresholdSlice";
// import { Session } from "../../../types/sessionType";
// import { getColorForValue } from "../../../utils/thresholdColors";

// type Props = {
//   sessions: Session[];
//   unitSymbol: string;
// };

// const StreamMarkers = ({ sessions, unitSymbol }: Props) => {
//   const dispatch = useAppDispatch();
//   const map = useMap();
//   const markersRef = useRef<google.maps.Marker[]>([]);
//   const thresholds = useSelector(selectThresholds);
//   const polylineRef = useRef<google.maps.Polyline | null>(null);

//   // Sort sessions by time
//   const sortedSessions = useMemo(
//     () =>
//       [...sessions].sort((a, b) => {
//         const timeA = a.time ? new Date(a.time).getTime() : 0;
//         const timeB = b.time ? new Date(b.time).getTime() : 0;
//         return timeA - timeB;
//       }),
//     [sessions]
//   );

//   // useEffect(() => {
//   //   dispatch(setMarkersLoading(true));
//   //   dispatch(setTotalMarkers(sessions.length));
//   // }, [dispatch, sessions.length]);

//   // Create and update polyline and markers
//   useEffect(() => {
//     if (!map) return;

//     // Cleanup previous markers
//     markersRef.current.forEach((marker) => {
//       marker.setMap(null);
//     });
//     markersRef.current = [];

//     // Create markers and add them to the map
//     sortedSessions.forEach((session) => {
//       const marker = new google.maps.Marker({
//         position: { lat: session.point.lat, lng: session.point.lng },
//         map,
//         title: `${session.lastMeasurementValue} ${unitSymbol}`,
//         zIndex: 0,
//         icon: {
//           // Customize your marker icon if needed
//           path: google.maps.SymbolPath.CIRCLE,
//           fillColor: getColorForValue(thresholds, session.lastMeasurementValue),
//           fillOpacity: 1,
//           strokeColor: getColorForValue(
//             thresholds,
//             session.lastMeasurementValue
//           ),
//           strokeWeight: 1,
//           scale: 6,
//         },
//       });

//       // Optionally, add event listeners to the marker here

//       markersRef.current.push(marker);
//     });

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

//     // Cleanup function to remove markers and polyline when component unmounts or sessions change
//     return () => {
//       // Remove markers from map
//       markersRef.current.forEach((marker) => {
//         marker.setMap(null);
//       });
//       markersRef.current = [];

//       // Remove polyline from map
//       if (polylineRef.current) {
//         polylineRef.current.setMap(null);
//         polylineRef.current = null;
//       }
//     };
//   }, [map, sortedSessions, unitSymbol, thresholds]);

//   return null; // No JSX needed since we're directly interacting with the Google Maps API
// };

// export { StreamMarkers };
// StreamMarkers.tsx

import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

import { mobileStreamPath } from "../../../assets/styles/colors";
import { selectThresholds } from "../../../store/thresholdSlice";
import { Session } from "../../../types/sessionType";
import { getColorForValue } from "../../../utils/thresholdColors";

type Props = {
  sessions: Session[];
  unitSymbol: string;
};

const StreamMarkers: React.FC<Props> = ({ sessions, unitSymbol }) => {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const thresholds = useSelector(selectThresholds);

  // Memoize the sorted sessions to prevent unnecessary recalculations
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = a.time ? new Date(a.time).getTime() : 0;
      const timeB = b.time ? new Date(b.time).getTime() : 0;
      return timeA - timeB;
    });
  }, [sessions]);

  useEffect(() => {
    if (!map || sortedSessions.length === 0) return;

    // Create or update the polyline
    const path = sortedSessions.map((session) => ({
      lat: session.point.lat,
      lng: session.point.lng,
    }));

    if (polylineRef.current) {
      // Update the existing polyline's path
      polylineRef.current.setPath(path);
    } else {
      // Create a new polyline
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor: mobileStreamPath,
        strokeOpacity: 0.7,
        strokeWeight: 4,
      });
    }

    // Create markers only if they haven't been created yet
    if (markersRef.current.length === 0) {
      // Batch marker creation to prevent blocking the main thread
      const batchSize = 100;
      let index = 0;

      function createBatch() {
        const batch = sortedSessions.slice(index, index + batchSize);
        batch.forEach((session) => {
          const marker = new google.maps.Marker({
            position: { lat: session.point.lat, lng: session.point.lng },
            map,
            title: `${session.lastMeasurementValue} ${unitSymbol}`,
            zIndex: 0,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getColorForValue(
                thresholds,
                session.lastMeasurementValue
              ),
              fillOpacity: 1,
              strokeColor: getColorForValue(
                thresholds,
                session.lastMeasurementValue
              ),
              strokeWeight: 1,
              scale: 6,
            },
          });

          markersRef.current.push(marker);
        });
        index += batchSize;
        if (index < sortedSessions.length) {
          setTimeout(createBatch, 0);
        }
      }

      createBatch();
    }

    // Cleanup function to remove markers and polyline when the component unmounts
    return () => {
      // Remove markers from the map
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          google.maps.event.clearInstanceListeners(marker);
          marker.setMap(null);
        });
        markersRef.current = [];
      }

      // Remove polyline from the map
      if (polylineRef.current) {
        google.maps.event.clearInstanceListeners(polylineRef.current);
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, sortedSessions, unitSymbol, thresholds]);

  return null; // No JSX needed since we're directly interacting with the Google Maps API
};

export { StreamMarkers };
