import React from "react";
import { useTranslation } from "react-i18next";

import copyLink from "../../../../../assets/icons/copyLink.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import shareLink from "../../../../../assets/icons/shareLink.svg";
import { copyCurrentURL } from "../../../../../utils/copyCurrentUrl";
import useShortenedLink from "../../../../../utils/useShortenedLink";
import { ActionButton } from "../../../../ActionButton/ActionButton.style";
import { Button } from "../../../../Button/Button.style";
import { ExportDataModal } from "../../../../Modals";
import { SmallPopup } from "../../../../Modals/SessionDetailsModal/SessionDetailsModal.style";
import * as S from "./StationActionButtons.style";

interface Props {
  sessionId: string;
}
const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN || "";

const StationActionButtons = ({ sessionId }: Props) => {
  const currentUrl = window.location.href;
  const { t } = useTranslation();
  const { shortenedLink, error } = useShortenedLink(
    currentUrl,
    BITLY_ACCESS_TOKEN
  );

  const handleCopyLink = () => {
    copyCurrentURL(shortenedLink);
    alert("Link copied to clipboard");
  };

  if (error) {
    console.error("Error shortening link: ", error.message);
  }

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
          onClick={handleCopyLink}
          aria-label={t("calendarHeader.altShareLink")}
        >
          <img src={shareLink} />
        </ActionButton>
      </S.MobileButtons>
      <S.DesktopButtons>
        <Button
          onClick={handleCopyLink}
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
