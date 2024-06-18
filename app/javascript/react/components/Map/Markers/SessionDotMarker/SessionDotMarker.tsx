import React from "react";

import { DataContainer, MarkerCircle, MarkerContainer } from "./SessionDotMarker.style";

interface MarkerProps {
  color: string;
  isPulsating?: boolean;
  onClick: () => void;
}

const SessionDotMarker = ({ color, isPulsating = false, onClick }: MarkerProps) => {
  return (
    <MarkerContainer onClick={onClick}>
      <DataContainer>
        <MarkerCircle color={color} shouldPulse={isPulsating}/>
      </DataContainer>
    </MarkerContainer>
  );
};

export { SessionDotMarker };
