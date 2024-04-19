import React from "react";
import { useTranslation } from "react-i18next";

import bellAlert from "../../../../../assets/icons/bellAlert.svg";
import copyLink from "../../../../../assets/icons/copyLink.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import shareLink from "../../../../../assets/icons/shareLink.svg";
import { Button } from "../../../../Button/Button";
import { ActionButton } from "../../../../ActionButton/ActionButton";
import * as S from "./StationActionButtons.style";

const StationActionButtons = () => {
  const { t } = useTranslation();

  return (
    <>
      <S.MobileButtons>
        <ActionButton
          onClick={() => {}}
          aria-label={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} />
        </ActionButton>
      </S.MobileButtons>
      <S.DesktopButtons>
        <Button
          onClick={copyCurrentURL}
          aria-label={t("calendarHeader.altShareLink")}
        >
          {t("calendarHeader.copyLink")} <img src={copyLink} />
        </Button>
      </S.DesktopButtons>
    </>
  );
};

const copyCurrentURL = () => {
  const currentURL = window.location.href;
  navigator.clipboard.writeText(currentURL);
};

export { StationActionButtons };
