import React from "react";

import { StreamMarkerCircle } from "./StreamMarker.style";

interface StreamMarkerProps {
  color: string;
}

const StreamMarker = ({ color }: StreamMarkerProps) => {
  return <StreamMarkerCircle color={color} />;
};

export { StreamMarker };
