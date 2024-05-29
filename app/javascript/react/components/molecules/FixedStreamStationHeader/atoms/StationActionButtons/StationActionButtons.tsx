import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import copyLink from "../../../../../assets/icons/copyLink.svg";
import shareLink from "../../../../../assets/icons/shareLink.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import { Button } from "../../../../Button/Button";
import { ActionButton } from "../../../../ActionButton/ActionButton";
import * as S from "./StationActionButtons.style";
import { ExportDataModal } from "../../../../Modals";
import { copyCurrentURL } from "../../../../../utils/copyCurrentUrl";
import Popup from "reactjs-popup";

interface Props {
  sessionId: string;
}

const StationActionButtons = ({ sessionId }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <S.MobileButtons>
        <ActionButton
          onClick={() => {}}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          <img src={downloadImage} />
        </ActionButton>
        <ActionButton
          onClick={copyCurrentURL}
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
          {t("calendarHeader.copyLink")}{" "}
          <img src={copyLink} alt={t("Copy link")} />
        </Button>
        <Popup
          trigger={
            <Button aria-labelledby={t("calendarHeader.altExportSession")}>
              {t("calendarHeader.exportSession")} <img src={downloadImage} />
            </Button>
          }
          nested
          closeOnDocumentClick
        >
          <ExportDataModal sessionId={sessionId} onSubmit={(formData) => {}} />
        </Popup>
      </S.DesktopButtons>
    </>
  );
};

export { StationActionButtons };
