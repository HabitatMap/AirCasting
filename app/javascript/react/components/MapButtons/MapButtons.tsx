import React from "react";

import { useTranslation } from "react-i18next";
import copyLinkButton from "../../assets/icons/copyLink.svg";
import filterIcon from "../../assets/icons/filter.svg";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

const MapButtons = () => {
  const { t } = useTranslation();
  return (
    <S.MapButtonsWrapper>
      <MapButton
        title={t("navbar.filter")}
        image={filterIcon}
        onClick={() => console.log("filter click")}
        alt={t("navbar.altFilter")}
        isActive
      />
      <MapButton
        title={t("navbar.timelapse")}
        image={filterIcon}
        onClick={() => console.log("timelapse click")}
        alt={t("navbar.altTimelapse")}
      />
      <MapButton
        title={t("navbar.copyLink")}
        image={copyLinkButton}
        onClick={() => console.log("copy link click")}
        alt={t("navbar.altCopyLink")}
      />
      <MapButton
        title="share"
        image={filterIcon}
        onClick={() => console.log("share click")}
        alt="share icon"
      />
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
