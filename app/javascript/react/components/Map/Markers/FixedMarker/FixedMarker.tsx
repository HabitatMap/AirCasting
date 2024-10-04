import React from "react";
import {
  FixedMarkerContainer,
  FixedMarkerCircle,
  FixedMarkerDot,
  FixedMarkerInfo,
} from "./FixedMarker.style";
import { DataContainer } from "../RectangleInfo/RectangleInfo.style";

interface FixedMarkerProps {
  color: string;
  value: string;
  position: { top: number; left: number };
  visible: boolean;
  isSelected: boolean;
  shouldPulse: boolean;
}

const FixedMarker = ({
  color,
  value,
  position,
  visible,
  isSelected = false,
  shouldPulse = false,
}: FixedMarkerProps) => {
  const roundedValue = Math.round(Number(value.split(" ")[0]));
  const unit = value.split(" ")[1];
  const displayedValue = `${roundedValue} ${unit}`;
  return (
    <FixedMarkerContainer
      $color={color}
      $top={position.top}
      $left={position.left}
      $visible={visible}
    >
      <FixedMarkerCircle
        $color={color}
        $shouldPulse={shouldPulse}
        $isSelected={isSelected}
      />
      <DataContainer $color={color}>
        <FixedMarkerDot $color={color} />
        <FixedMarkerInfo>{displayedValue}</FixedMarkerInfo>
      </DataContainer>
    </FixedMarkerContainer>
  );
};

export { FixedMarker };
