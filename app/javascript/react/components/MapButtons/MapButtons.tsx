import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import copyLinkButton from "../../assets/icons/copyLink.svg";
import filterIcon from "../../assets/icons/filter.svg";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

const ButtonTypes = {
  FILTER: "filter",
  TIMELAPSE: "timelapse",
  COPY_LINK: "copyLink",
  SHARE: "share",
};

type ButtonType =
  | typeof ButtonTypes.FILTER
  | typeof ButtonTypes.TIMELAPSE
  | typeof ButtonTypes.COPY_LINK
  | typeof ButtonTypes.SHARE;

const MapButtons = () => {
  const [buttonActive, setButtonActive] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleClick = (buttonType: ButtonType) => {
    if (buttonType !== buttonActive) {
      setButtonActive(buttonType);
    }
    if (buttonType === buttonActive) {
      setButtonActive(null);
    }
  };

  return (
    <S.MapButtonsWrapper>
      <MapButton
        title={t("navbar.filter")}
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.FILTER)}
        alt={t("navbar.altFilter")}
        isActive={ButtonTypes.FILTER === buttonActive}
      />
      <MapButton
        title={t("navbar.timelapse")}
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
        alt={t("navbar.altTimelapse")}
        isActive={ButtonTypes.TIMELAPSE === buttonActive}
      />
      <MapButton
        title={t("navbar.copyLink")}
        image={copyLinkButton}
        onClick={() => handleClick(ButtonTypes.COPY_LINK)}
        alt={t("navbar.altCopyLink")}
        isActive={ButtonTypes.COPY_LINK === buttonActive}
      />
      <MapButton
        title={t("navbar.share")}
        image={filterIcon}
        onClick={() => handleClick(ButtonTypes.SHARE)}
        alt={t("navbar.altShare")}
        isActive={ButtonTypes.SHARE === buttonActive}
      />
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
