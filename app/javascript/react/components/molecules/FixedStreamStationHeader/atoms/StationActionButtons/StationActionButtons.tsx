import React from "react";
import { useTranslation } from "react-i18next";

import copyLink from "../../../../../assets/icons/copyLink.svg";
import shareLink from "../../../../../assets/icons/shareLink.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import { Button } from "../../../../Button/Button.style";
import { ActionButton } from "../../../../ActionButton/ActionButton.style";
import * as S from "./StationActionButtons.style";
import { ExportDataModal } from "../../../../Modals";
import { copyCurrentURL } from "../../../../../utils/copyCurrentUrl";
import { SmallPopup } from "../../../../SessionDetailsModal/SessionDetailsModal.style";

interface Props {
  sessionId: string;
}

const StationActionButtons = ({ sessionId }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <S.MobileButtons>
        <SmallPopup
          trigger={
            <ActionButton
              onClick={() => {}}
              aria-labelledby={t("calendarHeader.altExportSession")}
            >
              <img src={downloadImage} />
            </ActionButton>
          }
          closeOnDocumentClick
          nested
          position="top center"
        >
          <ExportDataModal sessionId={sessionId} onSubmit={(formData) => {}} />
        </SmallPopup>
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
        <SmallPopup
          trigger={
            <Button aria-labelledby={t("calendarHeader.altExportSession")}>
              {t("calendarHeader.exportSession")} <img src={downloadImage} />
            </Button>
          }
          closeOnDocumentClick
          nested
          position="top center"
        >
          <ExportDataModal sessionId={sessionId} onSubmit={(formData) => {}} />
        </SmallPopup>
      </S.DesktopButtons>
    </>
  );
};

export { StationActionButtons };
