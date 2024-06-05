import React from "react";

import { StreamMarkerCircle } from "./StreamSingleMarker.style";

interface StreamMarkerProps {
  color: string;
}

const StreamSingleMarker = ({ color }: StreamMarkerProps) => {
  return <StreamMarkerCircle color={color} />;
};

export { StreamSingleMarker };
