import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useScrollEndListener } from "../../hooks/useScrollEndListener";
import { useAutoDismissAlert } from "../../utils/useAutoDismissAlert";
import { AlertPopup } from "../Popups/AlertComponent";
import ExportButtonComponent from "./ExportButtonComponent";
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
  onScrollEnd: () => void;
  fetchableSessionsCount: number;
}

const SESSIONS_LIMIT = 100;

const SessionsListView = ({
  sessions,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave,
  onScrollEnd,
  fetchableSessionsCount,
}: SessionsListViewProps) => {
  const { t } = useTranslation();
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const sessionListRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>("");

  const results = useMemo(() => sessions.length, [sessions]);
  const sessionsIds = useMemo(
    () => sessions.map((session) => session.id),
    [sessions]
  );
  const NO_SESSIONS = useMemo(() => sessionsIds.length === 0, [sessionsIds]);
  const EXCEEDS_LIMIT = useMemo(
    () => sessionsIds.length > SESSIONS_LIMIT,
    [sessionsIds]
  );
  const popupTopOffset = NO_SESSIONS ? -13 : -50;

  const updateButtonPosition = useCallback(() => {
    if (exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, []);

  useEffect(() => {
    updateButtonPosition();
    const handleResize = () => {
      requestAnimationFrame(updateButtonPosition);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateButtonPosition]);

  useScrollEndListener(sessionListRef, onScrollEnd);

  const calculatePopupLeftPosition = useCallback(() => {
    return `${buttonPosition.left - 185}px`;
  }, [buttonPosition.left]);

  const handleClick = useCallback(
    (id: number, streamId: number) => {
      onCellClick?.(id, streamId);
    },
    [onCellClick]
  );

  const handleMouseEnter = useCallback(
    (id: number) => {
      onCellMouseEnter?.(id);
    },
    [onCellMouseEnter]
  );

  const handleMouseLeave = useCallback(() => {
    onCellMouseLeave?.();
  }, [onCellMouseLeave]);

  const handleExportClick = useCallback(() => {
    if (NO_SESSIONS) {
      setAlertMessage(t("exportDataModal.noResultsMessage"));
      setShowAlert(true);
    } else if (EXCEEDS_LIMIT) {
      setAlertMessage(
        t("exportDataModal.sessionLimitMessage", { limit: SESSIONS_LIMIT })
      );
      setShowAlert(true);
    } else {
      setShowExportPopup(true);
    }
  }, [NO_SESSIONS, EXCEEDS_LIMIT, t]);

  useAutoDismissAlert(showAlert, setShowAlert);

  const sessionListItems = useMemo(
    () =>
      sessions.map((session) => (
        <SessionsListTile
          key={session.id}
          id={session.id}
          sessionName={session.sessionName}
          sensorName={session.sensorName}
          averageValue={session.averageValue}
          startTime={session.startTime}
          endTime={session.endTime}
          streamId={session.streamId}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )),
    [sessions, handleClick, handleMouseEnter, handleMouseLeave]
  );

  return (
    <S.SessionListViewStyle>
      <S.SessionInfoTile>
        <S.SessionListInfoContainer>
          <S.SessionListTitle>{t("map.listSessions")}</S.SessionListTitle>
          <S.SessionListTitle>
            {t("map.results", { results, fetchableSessionsCount })}
          </S.SessionListTitle>
        </S.SessionListInfoContainer>
        <ExportButtonComponent
          NO_SESSIONS={NO_SESSIONS}
          EXCEEDS_LIMIT={EXCEEDS_LIMIT}
          sessionsIds={sessionsIds}
          showExportPopup={showExportPopup}
          handleExportClick={handleExportClick}
          exportButtonRef={exportButtonRef}
        />
      </S.SessionInfoTile>
      <S.SessionListContainer ref={sessionListRef}>
        {sessionListItems}
      </S.SessionListContainer>
      {showAlert && (
        <AlertPopup
          open={showAlert}
          message={alertMessage}
          top={buttonPosition.top + popupTopOffset}
          left={calculatePopupLeftPosition()}
        />
      )}
    </S.SessionListViewStyle>
  );
};

export { SessionsListView };
