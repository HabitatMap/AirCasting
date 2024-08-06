import React from "react";
import { useTranslation } from "react-i18next";

import chevronLeft from "../../../../../assets/icons/chevronLeft.svg";
import chevronRight from "../../../../../assets/icons/chevronRightCircle.svg";
import mobileChevronLeft from "../../../../../assets/icons/mobileChevronLeft.svg";
import mobileChevronRight from "../../../../../assets/icons/mobileChevronRight.svg";
import { MovesKeys } from "../../../../../types/movesKeys";
import useScreenSizeDetection from "../../../../../utils/useScreenSizeDetection";
import { ScrollButton } from "../../../../ScrollButton/ScrollButton";

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
  const isMobile = useScreenSizeDetection();
  const icon = isMobile
    ? direction === MovesKeys.MOVE_BACKWARD
      ? mobileChevronLeft
      : mobileChevronRight
    : direction === MovesKeys.MOVE_BACKWARD
    ? chevronLeft
    : chevronRight;
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
