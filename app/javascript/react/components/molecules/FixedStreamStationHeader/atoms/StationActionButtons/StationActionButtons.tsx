import React from "react";
import { useTranslation } from "react-i18next";

import copyLinkIcon from "../../../../../assets/icons/copyLinkIcon.svg";
import downloadImage from "../../../../../assets/icons/download.svg";

import { ActionButton } from "../../../../ActionButton/ActionButton.style";
import { Button } from "../../../../Button/Button.style";
import { CopyLinkComponent } from "../../../../Popups/CopyLinkComponent";
import { ExportDataComponent } from "../../../../Popups/ExportDataComponent";
import * as S from "./StationActionButtons.style";

interface Props {
  sessionId: number;
}

const StationActionButtons = ({ sessionId }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <S.MobileButtons>
        <ExportDataComponent
          button={
            <ActionButton
              onClick={() => {}}
              aria-labelledby={t("calendarHeader.altExportSession")}
            >
              <img src={downloadImage} />
            </ActionButton>
          }
          sessionsIds={[sessionId]}
          isIconOnly
          onSubmit={(formData) => {}}
          fixedSessionTypeSelected={true}
          isSessionList={false}
        />
        <CopyLinkComponent
          button={
            <ActionButton aria-label={t("calendarHeader.altShareLink")}>
              <img src={copyLinkIcon} alt={t("calendarHeader.altCopyIcon")} />
            </ActionButton>
          }
          isIconOnly
        />
      </S.MobileButtons>
      <S.DesktopButtons>
        <CopyLinkComponent
          button={
            <Button aria-label={t("calendarHeader.altShareLink")}>
              {t("calendarHeader.copyLink")}
              <img src={copyLinkIcon} alt={t("calendarHeader.altCopyIcon")} />
            </Button>
          }
          isIconOnly={false}
        />
        <ExportDataComponent
          button={
            <Button aria-labelledby={t("calendarHeader.altExportSession")}>
              {t("calendarHeader.exportSession")} <img src={downloadImage} />
            </Button>
          }
          sessionsIds={[sessionId]}
          isIconOnly={false}
          onSubmit={(formData) => {}}
          fixedSessionTypeSelected={true}
          isSessionList={false}
        />
      </S.DesktopButtons>
    </>
  );
};

export { StationActionButtons };
