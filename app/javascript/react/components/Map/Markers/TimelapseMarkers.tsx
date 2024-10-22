import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { CustomCluster } from "./FixedMarkers";
import { ClusterOverlay } from "./clusterOverlay";
import { LabelOverlay } from "./customMarkerLabel";
import { CustomMarkerOverlay } from "./customMarkerOverlay";

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

const createPosition = (lat: number, lng: number) =>
  new google.maps.LatLng(lat, lng);

const createClusterOverlay = (
  key: string,
  session: SessionData,
  color: string,
  map: google.maps.Map
) =>
  new ClusterOverlay(
    {
      id: key,
      position: createPosition(session.latitude, session.longitude),
      count: session.sessions,
    } as CustomCluster,
    color,
    false,
    map,
    () => {}
  );

const createMarkerOverlay = (
  session: SessionData,
  color: string,
  map: google.maps.Map
) => {
  const position = createPosition(session.latitude, session.longitude);
  const markerOverlay = new CustomMarkerOverlay(position, color, false, false);
  markerOverlay.setMap(map);
  return markerOverlay;
};

const createLabelOverlay = (
  session: SessionData,
  color: string,
  unitSymbol: string,
  map: google.maps.Map
) => {
  const position = createPosition(session.latitude, session.longitude);
  const zIndex = calculateZIndex(session.sessions);
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
  return labelOverlay;
};

export const TimelapseMarkers = ({ sessions }: Props) => {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();
  const map = useMap();
  const markersRef = useRef<Map<string, TimelapseMarker>>(new Map());

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  const updateExistingMarker = (
    timelapseMarker: TimelapseMarker,
    session: SessionData,
    isCluster: boolean,
    color: string,
    key: string
  ) => {
    if (
      isCluster &&
      !(timelapseMarker.markerOverlay instanceof ClusterOverlay)
    ) {
      convertToCluster(timelapseMarker, session, color, key);
    } else if (
      !isCluster &&
      timelapseMarker.markerOverlay instanceof ClusterOverlay
    ) {
      convertToMarker(timelapseMarker, session, color);
    } else {
      updateMarker(timelapseMarker, session, color, key);
    }
  };

  const convertToCluster = (
    timelapseMarker: TimelapseMarker,
    session: SessionData,
    color: string,
    key: string
  ) => {
    timelapseMarker.markerOverlay.setMap(null);
    if (timelapseMarker.labelOverlay) timelapseMarker.labelOverlay.setMap(null);
    timelapseMarker.markerOverlay = createClusterOverlay(
      key,
      session,
      color,
      map!
    );
    timelapseMarker.labelOverlay = null;
  };

  const convertToMarker = (
    timelapseMarker: TimelapseMarker,
    session: SessionData,
    color: string
  ) => {
    timelapseMarker.markerOverlay.setMap(null);
    timelapseMarker.markerOverlay = createMarkerOverlay(session, color, map!);
    timelapseMarker.labelOverlay = createLabelOverlay(
      session,
      color,
      unitSymbol,
      map!
    );
  };

  const updateMarker = (
    timelapseMarker: TimelapseMarker,
    session: SessionData,
    color: string,
    key: string
  ) => {
    if (timelapseMarker.markerOverlay instanceof ClusterOverlay) {
      // Create a new cluster overlay instead of updating the existing one
      timelapseMarker.markerOverlay.setMap(null);
      timelapseMarker.markerOverlay = createClusterOverlay(
        key,
        session,
        color,
        map!
      );
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
  };

  const createNewMarker = (
    session: SessionData,
    isCluster: boolean,
    color: string,
    key: string
  ) => {
    if (isCluster) {
      markersRef.current.set(key, {
        markerOverlay: createClusterOverlay(key, session, color, map!),
        labelOverlay: null,
      });
    } else {
      markersRef.current.set(key, {
        markerOverlay: createMarkerOverlay(session, color, map!),
        labelOverlay: createLabelOverlay(session, color, unitSymbol, map!),
      });
    }
  };

  const removeObsoleteMarkers = (sessionsMap: Map<string, SessionData>) => {
    markersRef.current.forEach((timelapseMarker, key) => {
      if (!sessionsMap.has(key)) {
        timelapseMarker.markerOverlay.setMap(null);
        if (timelapseMarker.labelOverlay)
          timelapseMarker.labelOverlay.setMap(null);
        markersRef.current.delete(key);
      }
    });
  };

  useEffect(() => {
    if (!map) return;

    const sessionsMap = new Map(
      memoizedSessions.map((session) => [
        `${session.latitude}-${session.longitude}`,
        session,
      ])
    );

    sessionsMap.forEach((session, key) => {
      const color = getColorForValue(thresholds, session.value);
      const isCluster = session.sessions > 1;
      let timelapseMarker = markersRef.current.get(key);

      if (timelapseMarker) {
        updateExistingMarker(timelapseMarker, session, isCluster, color, key);
      } else {
        createNewMarker(session, isCluster, color, key);
      }
    });

    removeObsoleteMarkers(sessionsMap);
  }, [map, memoizedSessions, thresholds, unitSymbol]);

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
};
