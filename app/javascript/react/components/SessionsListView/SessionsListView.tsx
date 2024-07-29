import * as React from "react";
import { useTranslation } from "react-i18next";

import { useAutoDismissAlert } from "../../utils/useAutoDismissAlert";
import { AlertPopup } from "../Popups/AlertComponent";
import {
  ExportDataComponent,
  ExportModalData,
} from "../Popups/ExportDataComponent";
import { SessionsListTile } from "./SessionsListTile/SessionListTile";
import * as S from "./SessionsListView.style";

export interface SessionListEntity {
  id: number;
  sessionName: string;
  sensorName: string;
  averageValue: number;
  startTime: string;
  endTime: string;
  streamId: number;
}

interface SessionsListViewProps {
  sessions: SessionListEntity[];
  onCellClick?: (id: number, streamId: number) => void;
  onCellMouseEnter?: (id: number) => void;
  onCellMouseLeave?: () => void;
}

const SESSIONS_LIMIT = 100;

const SessionsListView: React.FC<SessionsListViewProps> = ({
  sessions,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave,
}) => {
  const { t } = useTranslation();
  const results = sessions.length;
  const sessionsIds = sessions.map((session) => session.id.toString());
  const exportButtonRef = React.useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = React.useState({
    top: 0,
    left: 0,
  });
  const [showExportPopup, setShowExportPopup] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

  const rect = exportButtonRef.current?.getBoundingClientRect();

  const updateButtonPosition = () => {
    if (rect) {
      setButtonPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  React.useEffect(() => {
    updateButtonPosition();
    window.addEventListener("resize", updateButtonPosition);

    return () => {
      window.removeEventListener("resize", updateButtonPosition);
    };
  }, [rect?.top]);

  const calculatePopupLeftPosition = () => {
    return `${buttonPosition.left - 185}px`;
  };

  const popupTopOffset = -50;

  const NO_SESSIONS = sessionsIds.length === 0;
  const EXCEEDS_LIMIT = sessionsIds.length > SESSIONS_LIMIT;

  useAutoDismissAlert(showAlert, setShowAlert);

  const handleClick = (id: number, streamId: number) => {
    if (onCellClick) {
      onCellClick(id, streamId);
    }
  };

  const handleMouseEnter = (id: number) => {
    if (onCellMouseEnter) {
      onCellMouseEnter(id);
    }
  };

  const handleMouseLeave = () => {
    if (onCellMouseLeave) {
      onCellMouseLeave();
    }
  };

  const handleExportClick = () => {
    if (NO_SESSIONS) {
      setAlertMessage(t("exportDataModal.noResultsMessage"));
      setShowAlert(true);
    } else if (EXCEEDS_LIMIT) {
      setAlertMessage(t("exportDataModal.sessionLimitMessage", { limit: 100 }));
      setShowAlert(true);
    } else {
      setShowExportPopup(true);
    }
  };

  return (
    <S.SessionListViewStyle>
      <S.SessionInfoTile>
        <S.SessionListInfoContainer>
          <S.SessionListTitle>{t("map.listSessions")}</S.SessionListTitle>
          <S.SessionListTitle>
            {t("map.results", { results: results })}
          </S.SessionListTitle>
        </S.SessionListInfoContainer>

        <div ref={exportButtonRef}>
          <S.ExportSessionsButton onClick={handleExportClick}>
            {t("map.exportButton")}
          </S.ExportSessionsButton>
        </div>
      </S.SessionInfoTile>
      <S.SessionListContainer>
        {sessions.map((session) => (
          <div key={session.id}>
            <SessionsListTile
              id={session.id}
              sessionName={session.sessionName}
              sensorName={session.sensorName}
              averageValue={session.averageValue}
              startTime={session.startTime}
              endTime={session.endTime}
              streamId={session.streamId}
              onClick={(id, streamId) => handleClick(id, streamId)}
              onMouseEnter={(id) => handleMouseEnter(id)}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        ))}
      </S.SessionListContainer>
      {showAlert && (
        <AlertPopup
          open={showAlert}
          message={alertMessage}
          top={buttonPosition.top + popupTopOffset}
          left={calculatePopupLeftPosition()}
        />
      )}
      {showExportPopup && (
        <ExportDataComponent
          button={<></>}
          sessionsIds={sessionsIds}
          isIconOnly
          onSubmit={(formData: ExportModalData) => {}}
          fixedSessionTypeSelected={true}
          isSessionList={true}
        />
      )}
    </S.SessionListViewStyle>
  );
};

export { SessionsListView };
