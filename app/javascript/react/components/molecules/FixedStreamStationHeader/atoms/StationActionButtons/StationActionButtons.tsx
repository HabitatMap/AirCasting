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

interface Props {
  sessionId: string;
}

const StationActionButtons = ({ sessionId }: Props) => {
  const [isExportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    bottom: number;
    left: number;
  }>({ bottom: 0, left: 0 });

  const { t } = useTranslation();

  const handleOpenDesktopExportModal = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      bottom: window.innerHeight - rect.bottom + rect.height + 1,
      left: rect.left,
    });
    setExportModalOpen(true);
  };

  const handleOpenMobileExportModal = () => {
    setExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setExportModalOpen(false);
  };

  return (
    <>
      <S.MobileButtons>
        <ActionButton
          onClick={handleOpenMobileExportModal}
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
        <Button
          onClick={handleOpenDesktopExportModal}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          {t("calendarHeader.exportSession")} <img src={downloadImage} />
        </Button>
      </S.DesktopButtons>

      <ExportDataModal sessionId={sessionId} onSubmit={(formData) => {}} />
    </>
  );
};

export { StationActionButtons };
