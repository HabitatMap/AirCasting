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

const mockedColor = "#E95F5F";

const SingleMarker = ({ color, value, isSelected, onClick }: MarkerProps) => {
  if (isSelected) {
    return (
      <MarkerContainer onClick={onClick}>
        <SelectedShadowCircle color={mockedColor} />
        <SelectedDataContainer color={mockedColor}>
          <MarkerCircle color={mockedColor} />
          <MarkerText> {value}</MarkerText>
        </SelectedDataContainer>
      </MarkerContainer>
    );
  } else {
    return (
      <MarkerContainer onClick={onClick}>
        <ShadowCircle color={mockedColor} />
        <DataContainer>
          <MarkerCircle color={mockedColor} />
          <MarkerText> {value}</MarkerText>
        </DataContainer>
      </MarkerContainer>
    );
  }
};

export { SingleMarker };
