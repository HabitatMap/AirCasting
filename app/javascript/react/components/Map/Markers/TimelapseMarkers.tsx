import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectThresholds } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { getColorForValue } from "../../../utils/thresholdColors";
import { ClusterlMarker } from "./ClusterMarker/ClusterMarker";

type Props = {
  sessions: {
    streamId: number;
    value: number;
    latitude: number;
    longitude: number;
  }[];
};

const TimelapseMarkers = ({ sessions }: Props) => {
  const thresholds = useSelector(selectThresholds);
  const { unitSymbol } = useMapParams();

  const memoizedSessions = useMemo(() => sessions, [sessions]);

  return (
    <>
      {memoizedSessions.map((session) => (
        <AdvancedMarker
          position={{
            lat: session.latitude,
            lng: session.longitude,
          }}
          key={session.streamId}
          zIndex={Number(google.maps.Marker.MAX_ZINDEX + 1)}
          title={session.value.toString()}
        >
          {/* <SessionFullMarker
            color={getColorForValue(thresholds, session.value)}
            value={`${Math.round(session.value)} ${unitSymbol}`}
          /> */}
          <ClusterlMarker
            color={getColorForValue(thresholds, session.value)}
            value={`${Math.round(session.value)} ${unitSymbol}`}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export { TimelapseMarkers };
