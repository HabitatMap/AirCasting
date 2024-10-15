import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";

import { ClusterOverlay } from "./clusterOverlay";
import { LabelOverlay } from "./customMarkerLabel";
import { CustomMarkerOverlay } from "./customMarkerOverlay";
import { CustomCluster } from "./FixedMarkers";

type SessionData = {
  value: number;
  latitude: number;
  longitude: number;
  sessions: number;
};

type Props = {
  sessions: SessionData[];
};

type TimelapseMarker = {
  markerOverlay: CustomMarkerOverlay | ClusterOverlay;
  labelOverlay: LabelOverlay | null;
};

const calculateZIndex = (sessions: number): number => {
  return sessions === 1
    ? Number(google.maps.Marker.MAX_ZINDEX) + 2
    : Number(google.maps.Marker.MAX_ZINDEX) + 1;
};

export function TimelapseMarkers({ sessions }: Props) {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();
  const map = useMap();
  const markersRef = useRef<Map<string, TimelapseMarker>>(new Map());

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  useEffect(() => {
    if (!map) return;

    const sessionsMap = new Map<string, SessionData>();
    memoizedSessions.forEach((session) => {
      const key = `${session.latitude}-${session.longitude}`;
      sessionsMap.set(key, session);
    });

    // Update existing markers and create new ones if necessary
    sessionsMap.forEach((session, key) => {
      let timelapseMarker = markersRef.current.get(key);

      const position = new google.maps.LatLng(
        session.latitude,
        session.longitude
      );
      const color = getColorForValue(thresholds, session.value);
      const zIndex = calculateZIndex(session.sessions);
      const isCluster = session.sessions > 1;

      if (timelapseMarker) {
        if (
          isCluster &&
          !(timelapseMarker.markerOverlay instanceof ClusterOverlay)
        ) {
          // Convert to cluster overlay
          timelapseMarker.markerOverlay.setMap(null);
          if (timelapseMarker.labelOverlay) {
            timelapseMarker.labelOverlay.setMap(null);
          }
          const clusterOverlay = new ClusterOverlay(
            {
              id: key,
              position: position,
              count: session.sessions,
            } as CustomCluster,
            color,
            false,
            map,
            () => {}
          );
          timelapseMarker.markerOverlay = clusterOverlay;
          timelapseMarker.labelOverlay = null;
        } else if (
          !isCluster &&
          timelapseMarker.markerOverlay instanceof ClusterOverlay
        ) {
          // Convert to marker overlay
          timelapseMarker.markerOverlay.setMap(null);
          const markerOverlay = new CustomMarkerOverlay(
            position,
            color,
            false,
            false
          );
          markerOverlay.setMap(map);
          timelapseMarker.markerOverlay = markerOverlay;

          const labelOverlay = new LabelOverlay(
            position,
            color,
            session.value,
            unitSymbol,
            false,
            () => {},
            zIndex
          );
          labelOverlay.setMap(map);
          timelapseMarker.labelOverlay = labelOverlay;
        } else {
          if (timelapseMarker.markerOverlay instanceof ClusterOverlay) {
          } else {
            timelapseMarker.markerOverlay.setColor(color);
          }

          if (timelapseMarker.labelOverlay) {
            timelapseMarker.labelOverlay.update(
              false,
              color,
              session.value,
              unitSymbol
            );
          }
        }
      } else {
        // Create new marker or cluster overlay
        if (isCluster) {
          const clusterOverlay = new ClusterOverlay(
            {
              id: key,
              position: position,
              count: session.sessions,
            } as CustomCluster,
            color,
            false,
            map,
            () => {}
          );
          markersRef.current.set(key, {
            markerOverlay: clusterOverlay,
            labelOverlay: null,
          });
        } else {
          const markerOverlay = new CustomMarkerOverlay(
            position,
            color,
            false,
            false
          );
          markerOverlay.setMap(map);

          const labelOverlay = new LabelOverlay(
            position,
            color,
            session.value,
            unitSymbol,
            false,
            () => {},
            zIndex
          );
          labelOverlay.setMap(map);

          markersRef.current.set(key, { markerOverlay, labelOverlay });
        }
      }
    });

    // Remove markers that are no longer in the sessions array
    markersRef.current.forEach((timelapseMarker, key) => {
      if (!sessionsMap.has(key)) {
        timelapseMarker.markerOverlay.setMap(null);
        if (timelapseMarker.labelOverlay) {
          timelapseMarker.labelOverlay.setMap(null);
        }
        markersRef.current.delete(key);
      }
    });
  }, [map, memoizedSessions, thresholds, unitSymbol]);

  // Cleanup markers when component unmounts
  useEffect(() => {
    return () => {
      markersRef.current.forEach((timelapseMarker) => {
        timelapseMarker.markerOverlay.setMap(null);
        if (timelapseMarker.labelOverlay) {
          timelapseMarker.labelOverlay.setMap(null);
        }
      });
      markersRef.current.clear();
    };
  }, []);

  return null;
}
