import React from "react";

import { DataContainer, MarkerCircle, MarkerContainer } from "./SessionDotMarker.style";

interface MarkerProps {
  color: string;
  onClick: () => void;
}

const SessionDotMarker = ({ color, onClick }: MarkerProps) => {
  return (
    <MarkerContainer onClick={onClick}>
      <DataContainer>
        <MarkerCircle color={color} />
      </DataContainer>
    </MarkerContainer>
  );
};

export { SessionDotMarker };
