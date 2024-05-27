import React from "react";
import {
  MarkerContainer,
  ShadowCircle,
  DataContainer,
  MarkerCircle,
  MarkerText,
} from "./Marker.style";

interface MarkerProps {
  color: string;
  value: number;
  isSelected?: boolean;
}

const mockedColor = "#E95F5F";
// Change name after removing google marker
const SingleMarker = ({ color, value }: MarkerProps) => {
  return (
    <MarkerContainer>
      <ShadowCircle color={mockedColor} />
      <DataContainer>
        <MarkerCircle color={mockedColor} />
        <MarkerText> {value}</MarkerText>
      </DataContainer>
    </MarkerContainer>
  );
};

export { SingleMarker };
