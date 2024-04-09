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
          aria-labelledby={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} />
        </ActionButton>
      </S.MobileButtons>
      <S.DesktopButtons>
        <Button
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altShareLink")}
        >
          {t("calendarHeader.copyLink")} <img src={copyLink} />
        </Button>
        {
          // In MVP we don't have this feature
          /* <Button
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          {t("calendarHeader.exportSession")} <img src={downloadImage} />
        </Button> */
        }
      </S.DesktopButtons>
    </>
  );
};

export { StationActionButtons };
