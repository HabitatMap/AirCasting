import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import copyLinkButton from "../../assets/icons/copyLink.svg";
import filterIcon from "../../assets/icons/filter.svg";
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
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
        alt={t("navbar.altTimelapse")}
        isActive={activeButton === ButtonTypes.TIMELAPSE}
      />
      <MapButton
        title={t("navbar.copyLink")}
        image={copyLinkButton}
        onClick={() => handleClick(ButtonTypes.COPY_LINK)}
        alt={t("navbar.altCopyLink")}
        isActive={activeButton === ButtonTypes.COPY_LINK}
      />
      <MapButton
        title={t("navbar.share")}
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.SHARE)}
        alt={t("navbar.altShare")}
        isActive={activeButton === ButtonTypes.SHARE}
      />
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
