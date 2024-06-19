import React from "react";

import { DataContainer, MarkerCircle, MarkerContainer } from "./SessionDotMarker.style";

interface MarkerProps {
  color: string;
  shouldPulse?: boolean;
  onClick: () => void;
}

const SessionDotMarker = ({ color, shouldPulse = false, onClick }: MarkerProps) => {
  return (
    <MarkerContainer onClick={onClick}>
      <DataContainer>
        <MarkerCircle color={color} shouldPulse={shouldPulse}/>
      </DataContainer>
    </MarkerContainer>
  );
};

export { SessionDotMarker };
