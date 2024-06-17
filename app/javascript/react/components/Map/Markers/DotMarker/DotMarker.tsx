import React from "react";

import { DataContainer, MarkerCircle, MarkerContainer } from "./DotMarker.style";

interface MarkerProps {
  color: string;
  onClick: () => void;
}

const DotMarker = ({ color, onClick }: MarkerProps) => {
  return (
    <MarkerContainer onClick={onClick}>
      <DataContainer>
        <MarkerCircle color={color} />
      </DataContainer>
    </MarkerContainer>
  );
};

export { DotMarker };
