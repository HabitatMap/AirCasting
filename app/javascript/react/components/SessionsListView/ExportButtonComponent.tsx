// ExportButtonComponent.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { ExportDataComponent } from "../Popups/ExportDataComponent";
import * as S from "./SessionsListView.style";

interface ExportButtonComponentProps {
  NO_SESSIONS: boolean;
  EXCEEDS_LIMIT: boolean;
  sessionsIds: string[];
  showExportPopup: boolean;
  handleExportClick: () => void;
  exportButtonRef: React.RefObject<HTMLDivElement>;
}

const ExportButtonComponent: React.FC<ExportButtonComponentProps> = ({
  NO_SESSIONS,
  EXCEEDS_LIMIT,
  sessionsIds,
  showExportPopup,
  handleExportClick,
  exportButtonRef,
}) => {
  const { t } = useTranslation();

  if (NO_SESSIONS || EXCEEDS_LIMIT) {
    return (
      <div ref={exportButtonRef}>
        <S.ExportSessionsButton
          onClick={handleExportClick}
          $hasSessions={false}
        >
          {t("map.exportButton")}
        </S.ExportSessionsButton>
      </div>
    );
  } else {
    return (
      <ExportDataComponent
        button={
          <S.ExportSessionsButton $hasSessions={true}>
            {t("map.exportButton")}
          </S.ExportSessionsButton>
        }
        sessionsIds={sessionsIds}
        isIconOnly
        onSubmit={(formData) => {}}
        fixedSessionTypeSelected={true}
        isSessionList={true}
        open={showExportPopup}
        ref={exportButtonRef}
      />
    );
  }
};

export default ExportButtonComponent;
