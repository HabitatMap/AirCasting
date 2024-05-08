import React from "react";

import { ScrollButton } from "../../../../ScrollButton/ScrollButton";
import chevronRight from "../../../../../assets/icons/chevronRight.svg";
import chevronLeft from "../../../../../assets/icons/chevronLeft.svg";

type ScrollButtonComponentProps = {
  direction: "left" | "right";
  handleClick: () => void;
  disabled?: boolean;
};

const ScrollCalendarButton: React.FC<ScrollButtonComponentProps> = ({
  direction,
  handleClick,
  disabled = false,
}) => {
  const icon = direction === "left" ? chevronLeft : chevronRight;
  const altText =
    direction === "left"
      ? "Move calendar page one step back"
      : "Move calendar page one step forward";

  return (
    <ScrollButton onClick={handleClick} disabled={disabled}>
      <img src={icon} alt={altText} />
    </ScrollButton>
  );
};

export { ScrollCalendarButton }
