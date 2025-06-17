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
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import toggleIconThick from "../../../assets/icons/toggleIconBlue.svg";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  selectSessionsListExpanded,
  setSessionsListExpanded,
} from "../../../store/mapSlice";
import { useAutoDismissAlert } from "../../../utils/useAutoDismissAlert";
import { AlertPopup } from "../Popups/AlertComponent";
import ExportButtonComponent from "./ExportButtonComponent";
import { SessionsListTile } from "./SessionsListTile/SessionListTile";
import * as S from "./SessionsListView.style";

interface RowData {
  sessions: SessionListEntity[];
  handleClick: (id: number, streamId: number) => void;
  handleMouseEnter: (id: number) => void;
  handleMouseLeave: () => void;
}

const Row = React.memo(
  ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: RowData;
  }) => {
    const { sessions, handleClick, handleMouseEnter, handleMouseLeave } = data;
    const session = sessions[index];
    if (!session) {
      return null;
    }

    return (
      <div style={style}>
        <div style={{ padding: "0.5rem 0" }}>
          <SessionsListTile
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
        </div>
      </div>
    );
  }
);

export interface SessionListEntity {
  id: number;
  sessionName: string;
  sensorName: string;
  averageValue: number | string;
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

const SESSIONS_LIMIT = 10000;

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
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });

  const NO_SESSIONS = sessionsIds.length === 0;
  const EXCEEDS_LIMIT = sessionsIds.length > SESSIONS_LIMIT;
  const popupTopOffset = NO_SESSIONS ? -13 : -50;
  const dispatch = useAppDispatch();
  const sessionsListExpanded = useAppSelector(selectSessionsListExpanded);
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);

  useEffect(() => {
    if (infiniteLoaderRef.current && sessions.length) {
      infiniteLoaderRef.current.resetloadMoreItemsCache();
    }
  }, [sessions]);

  useLayoutEffect(() => {
    function updateSize() {
      if (listContainerRef.current) {
        setListDimensions({
          width: listContainerRef.current.offsetWidth,
          height: listContainerRef.current.offsetHeight,
        });
      }
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  const itemCount =
    fetchableSessionsCount > sessions.length
      ? sessions.length + 1
      : sessions.length;

  const loadMoreItems = onScrollEnd;

  const isItemLoaded = (index: number) =>
    !fetchableSessionsCount || index < sessions.length;

  const handleClick = useCallback(
    (id: number, streamId: number) => {
      if (onCellClick) {
        onCellClick(id, streamId);
      }
    },
    [onCellClick]
  );

  const handleMouseEnter = useCallback(
    (id: number) => {
      if (onCellMouseEnter) {
        onCellMouseEnter(id);
      }
    },
    [onCellMouseEnter]
  );

  const handleMouseLeave = useCallback(() => {
    if (onCellMouseLeave) {
      onCellMouseLeave();
    }
  }, [onCellMouseLeave]);

  const itemData = useMemo(
    () => ({
      sessions,
      handleClick,
      handleMouseEnter,
      handleMouseLeave,
    }),
    [sessions, handleClick, handleMouseEnter, handleMouseLeave]
  );

  useEffect(() => {
    // Clear saved scroll position when sessions list is collapsed
    if (!sessionsListExpanded) {
      localStorage.removeItem("sessionsListScrollPosition");
    }
  }, [sessionsListExpanded]);

  const calculatePopupLeftPosition = () => {
    return `${buttonPosition.left - 185}px`;
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
        <S.SessionListContainer ref={listContainerRef}>
          <InfiniteLoader
            ref={infiniteLoaderRef}
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                height={listDimensions.height}
                width={listDimensions.width}
                itemCount={itemCount}
                itemSize={130}
                onItemsRendered={onItemsRendered}
                ref={ref}
                itemData={itemData}
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
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
