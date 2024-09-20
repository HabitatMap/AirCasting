import React from "react";

import { useAppSelector } from "../../../../store/hooks";
import { selectIsDormantSessionsType } from "../../../../store/sessionFiltersSlice";
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

interface MarkerProps {
  color: string;
  value?: string;
  isSelected?: boolean;
  shouldPulse?: boolean;
  onClick?: () => void;
}

const SessionFullMarker = ({
  color,
  value,
  isSelected,
  shouldPulse = false,
  onClick,
}: MarkerProps) => {
  const isDormant = useAppSelector(selectIsDormantSessionsType);

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
          {!isDormant && <MarkerText> {value}</MarkerText>}
        </DataContainer>
      </MarkerContainer>
    );
  }
};

export { SessionFullMarker };
