import React from "react";
import { useTranslation } from "react-i18next";

import copyLinkIcon from "../../../../../assets/icons/copyLinkIcon.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import shareLink from "../../../../../assets/icons/shareIcon.svg";

import { ActionButton } from "../../../../ActionButton/ActionButton.style";
import { Button } from "../../../../Button/Button.style";
import { CopyLinkComponent } from "../../../../Popups/CopyLinkComponent";
import { ExportDataComponent } from "../../../../Popups/ExportDataComponent";
import * as S from "./StationActionButtons.style";

interface Props {
  sessionId: string;
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
          sessionId={sessionId}
          isIconOnly={true}
          onSubmit={(formData) => {}}
          fixedSessionTypeSelected={true}
        />
        <CopyLinkComponent
          button={
            <ActionButton aria-label={t("calendarHeader.altShareLink")}>
              <img src={shareLink} />
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
          sessionId={sessionId}
          isIconOnly={false}
          onSubmit={(formData) => {}}
          fixedSessionTypeSelected={true}
        />
      </S.DesktopButtons>
    </>
  );
};

export { StationActionButtons };
