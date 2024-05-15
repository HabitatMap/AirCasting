import React from "react";
import { useTranslation } from "react-i18next";

import { ScrollButton } from "../../../../ScrollButton/ScrollButton";
import chevronRight from "../../../../../assets/icons/chevronRight.svg";
import chevronLeft from "../../../../../assets/icons/chevronLeft.svg";
import { MovesKeys } from "../../../../../types/movesKeys";

type ScrollButtonComponentProps = {
  direction: MovesKeys;
  handleClick: () => void;
  disabled?: boolean;
};

const ScrollCalendarButton: React.FC<ScrollButtonComponentProps> = ({
  direction,
  handleClick,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const icon =
    direction === MovesKeys.MOVE_BACKWARD ? chevronLeft : chevronRight;
  const altText =
    direction === MovesKeys.MOVE_BACKWARD
      ? t("calendarPage.backScrollButton")
      : t("calendarPage.forwardScrollButton");

  return (
    <ScrollButton onClick={handleClick} disabled={disabled}>
      <img src={icon} alt={altText} />
    </ScrollButton>
  );
};

export { ScrollCalendarButton };
