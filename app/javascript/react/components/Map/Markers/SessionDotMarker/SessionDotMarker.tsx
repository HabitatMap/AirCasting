import React from "react";

import {
  DataContainer,
  MarkerCircle,
  MarkerContainer,
} from "./SessionDotMarker.style";

interface MarkerProps {
  color: string;
  shouldPulse?: boolean;
  onClick: () => void;
  opacity?: boolean;
}

const SessionDotMarker = ({
  color,
  shouldPulse = false,
  onClick,
  opacity = false,
}: MarkerProps) => {
  return (
    <MarkerContainer onClick={onClick}>
      <DataContainer>
        <MarkerCircle
          color={color}
          $shouldPulse={shouldPulse}
          $opacity={opacity}
        />
      </DataContainer>
    </MarkerContainer>
  );
};

export { SessionDotMarker };
