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
  labelLeft: string;
  labelRight?: string;
  variant: "switch" | "toggle";
}

const Toggle: React.FC<ToggleProps> = ({
  isChecked,
  onChange,
  labelLeft,
  labelRight,
  variant,
}) => {
  const handleClick = () => {
    onChange(!isChecked);
  };

  return (
    <ToggleContainer onClick={handleClick}>
      <Label $isActive={!isChecked && variant === "switch"}>{labelLeft}</Label>
      <ToggleLabel>
        <ToggleInput
          type="checkbox"
          checked={isChecked}
          onChange={handleClick}
        />
        <Slider $isActive={isChecked} $variant={variant} />
      </ToggleLabel>
      {variant === "switch" && labelRight && (
        <Label $isActive={isChecked}>{labelRight}</Label>
      )}
    </ToggleContainer>
  );
};

export { Toggle };
