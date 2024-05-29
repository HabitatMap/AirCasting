import React from "react";

import {
  MarkerContainer,
  ShadowCircle,
  DataContainer,
  MarkerCircle,
  MarkerText,
} from "./SingleMarker.style";
import {
  SelectedShadowCircle,
  SelectedDataContainer,
} from "./SelectedMarker.style";

interface MarkerProps {
  color: string;
  value: string;
  isSelected?: boolean;
  onClick: () => void;
}

const SingleMarker = ({ color, value, isSelected, onClick }: MarkerProps) => {
  if (isSelected) {
    return (
      <MarkerContainer onClick={onClick}>
        <SelectedShadowCircle color={color} />
        <SelectedDataContainer color={color}>
          <MarkerCircle color={color} />
          <MarkerText> {value}</MarkerText>
        </SelectedDataContainer>
      </MarkerContainer>
    );
  } else {
    return (
      <MarkerContainer onClick={onClick}>
        <ShadowCircle color={color} />
        <DataContainer>
          <MarkerCircle color={color} />
          <MarkerText> {value}</MarkerText>
        </DataContainer>
      </MarkerContainer>
    );
  }
};

export { SingleMarker };
