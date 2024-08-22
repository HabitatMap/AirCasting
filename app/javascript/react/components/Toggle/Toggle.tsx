import React from "react";
import {
  Label,
  Slider,
  ToggleInput,
  ToggleLabel,
  ToggleContainer,
} from "./Toggle.style";

interface ToggleProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  noLabel?: boolean;
  labelLeft?: string;
  labelRight?: string;
  biggerMobileVersion?: boolean;
  variant: "switch" | "toggle";
}

const Toggle: React.FC<ToggleProps> = ({
  isChecked,
  onChange,
  noLabel = false,
  labelLeft,
  labelRight,
  biggerMobileVersion = false,
  variant,
}) => {
  const handleClick = () => {
    onChange(!isChecked);
  };

  return (
    <ToggleContainer onClick={handleClick}>
      {!noLabel && (
        <Label $isActive={!isChecked && variant === "switch"}>
          {labelLeft}
        </Label>
      )}
      <ToggleLabel biggerMobileVersion={biggerMobileVersion}>
        <ToggleInput
          type="checkbox"
          checked={isChecked}
          onChange={handleClick}
          biggerMobileVersion={biggerMobileVersion}
        />
        <Slider
          $isActive={isChecked}
          $variant={variant}
          biggerMobileVersion={biggerMobileVersion}
        />
      </ToggleLabel>
      {variant === "switch" && labelRight && (
        <Label $isActive={isChecked}>{labelRight}</Label>
      )}
    </ToggleContainer>
  );
};

export { Toggle };
