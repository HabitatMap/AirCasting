import React, { useEffect } from "react";

import {
  SelectedDataContainer,
  SelectedShadowCircle,
} from "../SelectedMarker.style";
import {
  DataContainer,
  MarkerCircle,
  MarkerContainer,
  MarkerText,
  ShadowCircle,
} from "./SessionFullMarker.style";
import { useAppDispatch } from "../../../../store/hooks";
import { incrementLoadedMarkers } from "../../../../store/markersLoadingSlice";

interface MarkerProps {
  color: string;
  value: string;
  isSelected?: boolean;
  shouldPulse?: boolean;
  onClick: () => void;
}

const SessionFullMarker = ({
  color,
  value,
  isSelected,
  shouldPulse = false,
  onClick,
}: MarkerProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(incrementLoadedMarkers());
  }, [dispatch]);

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
        <ShadowCircle color={color} $shouldPulse={shouldPulse} />
        <DataContainer>
          <MarkerCircle color={color} />
          <MarkerText> {value}</MarkerText>
        </DataContainer>
      </MarkerContainer>
    );
  }
};

export { SessionFullMarker };
