import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { TimeRanges } from "../../../types/timelapse";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterMarker } from "./ClusterMarker/ClusterMarker";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

type Props = {
  sessions: {
    value: number;
    latitude: number;
    longitude: number;
    sessions: number;
  }[];
  timeRange: TimeRanges;
};

const calculateZIndex = (sessions: number): number => {
  return sessions === 1
    ? Number(google.maps.Marker.MAX_ZINDEX + 2)
    : Number(google.maps.Marker.MAX_ZINDEX + 1);
};

const TimelapseMarkers = ({ sessions, timeRange }: Props) => {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const memoizedSessions = useMemo(
    () => (Array.isArray(sessions) ? sessions : []),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const now = moment();

    return sessions.filter((session) => {
      const sessionTime = moment(session.timestamp); // Parse session timestamp

      switch (timeRange) {
        case TimeRanges.HOURS_24:
          // Filter sessions that occurred within the last 24 hours
          return sessionTime.isAfter(now.clone().subtract(24, "hours"));
        case TimeRanges.DAYS_3:
          // Filter sessions that occurred within the last 3 days
          return sessionTime.isAfter(now.clone().subtract(3, "days"));
        case TimeRanges.DAYS_7:
          // Filter sessions that occurred within the last 7 days
          return sessionTime.isAfter(now.clone().subtract(7, "days"));
        default:
          // Default behavior if no specific range is matched
          return true;
      }
    });
  }, [sessions, timeRange]);

  return (
    <>
      {memoizedSessions.map((session, index) => (
        <AdvancedMarker
          position={{
            lat: session.latitude,
            lng: session.longitude,
          }}
          key={index}
          zIndex={calculateZIndex(session.sessions)}
          title={session.value.toString()}
        >
          {session.sessions === 1 ? (
            <SessionFullMarker
              color={getColorForValue(thresholds, session.value)}
              value={`${Math.round(session.value)} ${unitSymbol}`}
            />
          ) : (
            <ClusterMarker
              color={getColorForValue(thresholds, session.value)}
            />
          )}
        </AdvancedMarker>
      ))}
    </>
  );
};

export { TimelapseMarkers };
