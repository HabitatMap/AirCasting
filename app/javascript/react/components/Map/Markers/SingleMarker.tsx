import React from "react";
import {
  MarkerContainer,
  ShadowCircle,
  DataContainer,
  MarkerCircle,
  MarkerText,
} from "./SingleMarker.style";

interface MarkerProps {
  color: string;
  value: string;
  isSelected?: boolean;
  onClick: () => void;
}

const mockedColor = "#E95F5F";
// Change name after removing google marker
const SingleMarker = ({ color, value, onClick }: MarkerProps) => {
  return (
    <MarkerContainer onClick={onClick}>
      <ShadowCircle color={mockedColor} />
      <DataContainer>
        <MarkerCircle color={mockedColor} />
        <MarkerText> {value}</MarkerText>
      </DataContainer>
    </MarkerContainer>
  );
};

export { SingleMarker };
