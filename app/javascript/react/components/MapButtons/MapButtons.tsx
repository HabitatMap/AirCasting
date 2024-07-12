import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filter.svg";
import shareIcon from "../../assets/icons/shareIcon.svg";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

enum ButtonTypes {
  FILTER = "filter",
  TIMELAPSE = "timelapse",
  COPY_LINK = "copyLink",
  SHARE = "share",
}

const MapButtons = () => {
  const [activeButton, setActiveButton] = useState<ButtonTypes | null>(null);
  const { t } = useTranslation();

  const handleClick = (buttonType: ButtonTypes) => {
    setActiveButton((prevState) =>
      prevState === buttonType ? null : buttonType
    );
  };

  return (
    <S.MapButtonsWrapper>
      <MapButton
        title={t("navbar.filter")}
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.FILTER)}
        alt={t("navbar.altFilter")}
        isActive={activeButton === ButtonTypes.FILTER}
      />
      <MapButton
        title={t("navbar.timelapse")}
        image={clockIcon}
        onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
        alt={t("navbar.altTimelapse")}
        isActive={activeButton === ButtonTypes.TIMELAPSE}
      />
      <MapButton
        title={t("navbar.copyLink")}
        image={copyLinkIcon}
        onClick={() => handleClick(ButtonTypes.COPY_LINK)}
        alt={t("navbar.altCopyLink")}
        isActive={activeButton === ButtonTypes.COPY_LINK}
      />
      <MapButton
        title={t("navbar.share")}
        image={shareIcon}
        onClick={() => handleClick(ButtonTypes.SHARE)}
        alt={t("navbar.altShare")}
        isActive={activeButton === ButtonTypes.SHARE}
      />
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
