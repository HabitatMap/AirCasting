import { debounce } from "lodash"; // Ensure lodash is installed
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import toggleIconThick from "../../assets/icons/toggleIconBlue.svg";
import { useScrollEndListener } from "../../hooks/useScrollEndListener";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectSessionsListExpanded,
  setSessionsListExpanded,
} from "../../store/mapSlice";
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
  lastMeasurementValue?: number;
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

const SessionsListView: React.FC<SessionsListViewProps> = ({
  sessions,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave,
  onScrollEnd,
  fetchableSessionsCount,
}) => {
  const { t } = useTranslation();
  const results = sessions.length;
  const sessionsIds = sessions.map((session) => session.id);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const sessionListRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({
    top: 0,
    left: 0,
  });
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>("");

  const NO_SESSIONS = sessionsIds.length === 0;
  const EXCEEDS_LIMIT = sessionsIds.length > SESSIONS_LIMIT;
  const popupTopOffset = NO_SESSIONS ? -13 : -50;
  const memoizedSessions = useMemo(() => sessions, [sessions]);
  const dispatch = useAppDispatch();
  const sessionsListExpanded = useAppSelector(selectSessionsListExpanded);

  const updateButtonPosition = useCallback(() => {
    const rect = exportButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setButtonPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [exportButtonRef, sessions]);

  const debouncedUpdateButtonPosition = useCallback(
    debounce(updateButtonPosition, 100),
    [updateButtonPosition]
  );

  useLayoutEffect(() => {
    updateButtonPosition();

    const handleResize = () => {
      debouncedUpdateButtonPosition();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      debouncedUpdateButtonPosition.cancel();
    };
  }, [updateButtonPosition, debouncedUpdateButtonPosition]);

  useScrollEndListener(sessionListRef, onScrollEnd);

  useEffect(() => {
    // Clear saved scroll position when sessions list is collapsed
    if (!sessionsListExpanded) {
      localStorage.removeItem("sessionsListScrollPosition");
    }
  }, [sessionsListExpanded]);

  const calculatePopupLeftPosition = () => {
    return `${buttonPosition.left - 185}px`;
  };

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
      setAlertMessage(
        t("exportDataModal.sessionLimitMessage", { limit: SESSIONS_LIMIT })
      );
      setShowAlert(true);
    } else {
      setShowExportPopup(true);
    }
  };

  const handleExpandClick = () => {
    dispatch(setSessionsListExpanded(!sessionsListExpanded));
  };

  useAutoDismissAlert(showAlert, setShowAlert);

  return (
    <S.SessionListViewStyle>
      <S.SessionInfoTile>
        <S.SessionListInfoContainer>
          <S.ExpandButton onClick={handleExpandClick}>
            <S.RotatedIcon
              src={toggleIconThick}
              alt={t("headerToggle.arrowIcon")}
              $rotated={!sessionsListExpanded}
            />
            <S.SessionListTitle>{t("map.listSessions")}</S.SessionListTitle>
            <S.SessionListTitle>
              {t("map.results", { results, fetchableSessionsCount })}
            </S.SessionListTitle>
          </S.ExpandButton>
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
      {sessionsListExpanded && (
        <S.SessionListContainer ref={sessionListRef}>
          {memoizedSessions.map((session) => (
            <div key={session.id}>
              <SessionsListTile
                id={session.id}
                sessionName={session.sessionName}
                sensorName={session.sensorName}
                averageValue={session.averageValue}
                startTime={session.startTime}
                endTime={session.endTime}
                streamId={session.streamId}
                lastMeasurementValue={session.lastMeasurementValue}
                onClick={(id, streamId) => handleClick(id, streamId)}
                onMouseEnter={(id) => handleMouseEnter(id)}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          ))}
        </S.SessionListContainer>
      )}
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
