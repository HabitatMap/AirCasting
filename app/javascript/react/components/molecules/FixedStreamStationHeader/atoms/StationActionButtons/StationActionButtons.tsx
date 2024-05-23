import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import copyLink from "../../../../../assets/icons/copyLink.svg";
import shareLink from "../../../../../assets/icons/shareLink.svg";
import downloadImage from "../../../../../assets/icons/download.svg";
import { Button } from "../../../../Button/Button";
import { ActionButton } from "../../../../ActionButton/ActionButton";
import * as S from "./StationActionButtons.style";
import { ExportDataModal } from "../../../../ExportDataModal";

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

  const copyCurrentURL = () => {
    const currentURL = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(currentURL)
        .then(() => {
          alert("URL copied!");
        })
        .catch((error) => {
          console.error("Failed to copy URL: ", error);
        });
    } else {
      // Fallback for browsers that do not support Clipboard API
      const tempInput = document.createElement("input");
      tempInput.style.position = "absolute";
      tempInput.style.left = "-1000px";
      tempInput.value = currentURL;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      alert("URL copied!");
      tempInput.onerror = (e) => {
        console.log(e.toString);
      };
    }
  };

  const handleOpenExportModal = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      bottom: window.innerHeight - rect.bottom - rect.height,
      left: rect.left,
    });
    setExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    setExportModalOpen(false);
  };

  return (
    <>
      <S.MobileButtons>
        <ActionButton
          onClick={handleOpenExportModal}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          <img src={downloadImage} />
        </ActionButton>
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
          {t("calendarHeader.copyLink")}{" "}
          <img src={copyLink} alt={t("Copy link")} />
        </Button>
        <Button
          onClick={handleOpenExportModal}
          aria-labelledby={t("calendarHeader.altExportSession")}
        >
          {t("calendarHeader.exportSession")} <img src={downloadImage} />
        </Button>
      </S.DesktopButtons>
      <ExportDataModal
        sessionId={sessionId}
        isOpen={isExportModalOpen}
        onClose={handleCloseExportModal}
        position={modalPosition}
        onSubmit={(formData) => {}}
      />
    </>
  );
};

export { StationActionButtons };
