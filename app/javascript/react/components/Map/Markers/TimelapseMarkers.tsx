import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterlMarker } from "./ClusterMarker/ClusterMarker";
import { SessionFullMarker } from "./SessionFullMarker/SessionFullMarker";

type Props = {
  sessions: {
    value: number;
    latitude: number;
    longitude: number;
    sessions: number;
  }[];
};

const calculateZIndex = (sessions: number): number => {
  return sessions === 1
    ? Number(google.maps.Marker.MAX_ZINDEX + 2)
    : Number(google.maps.Marker.MAX_ZINDEX + 1);
};

const TimelapseMarkers = ({ sessions }: Props) => {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const memoizedSessions = useMemo(
    () => (Array.isArray(sessions) ? sessions : []),
    [sessions]
  );

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
            <ClusterlMarker
              color={getColorForValue(thresholds, session.value)}
            />
          )}
        </AdvancedMarker>
      ))}
    </>
  );
};

export { TimelapseMarkers };
