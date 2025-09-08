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
import { FixedSizeList as List, ListOnScrollProps } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import toggleIconThick from "../../../assets/icons/toggleIconBlue.svg";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  selectSessionsListExpanded,
  setSessionsListExpanded,
} from "../../../store/mapSlice";
import { CookieManager } from "../../../utils/cookieManager";
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
  isIndoor?: boolean;
  isDormant?: boolean;
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
    const {
      sessions,
      handleClick,
      handleMouseEnter,
      handleMouseLeave,
      isIndoor,
      isDormant,
    } = data;
    const session = sessions[index];
    if (!session) {
      return null;
    }

    return (
      <div style={style}>
        <div style={{ padding: isIndoor ? "0.1rem 0" : "0.5rem 0" }}>
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
            isIndoor={isIndoor}
            isDormant={isDormant}
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
  averageValue: number | string | null;
  startTime: string;
  endTime: string;
  streamId: number;
  lastMeasurementValue?: number;
  isDormant?: boolean;
}

interface SessionsListViewProps {
  sessions: SessionListEntity[];
  onCellClick?: (id: number, streamId: number) => void;
  onCellMouseEnter?: (id: number) => void;
  onCellMouseLeave?: () => void;
  onScrollEnd: () => void;
  fetchableSessionsCount: number;
  isIndoor?: boolean;
  isDormant?: boolean;
}

const SESSIONS_LIMIT = 10000;

const SessionsListView: React.FC<SessionsListViewProps> = ({
  sessions,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave,
  onScrollEnd,
  fetchableSessionsCount,
  isIndoor,
  isDormant,
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
  const [dimensionsReady, setDimensionsReady] = useState(false);

  const NO_SESSIONS = sessionsIds.length === 0;
  const EXCEEDS_LIMIT = sessionsIds.length > SESSIONS_LIMIT;
  const popupTopOffset = NO_SESSIONS ? -13 : -50;
  const dispatch = useAppDispatch();
  const sessionsListExpanded = useAppSelector(selectSessionsListExpanded);
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);

  const initialScrollOffset = useMemo(() => {
    if (sessionsListExpanded && CookieManager.arePreferenceCookiesAllowed()) {
      const savedScrollPosition = localStorage.getItem(
        "sessionsListScrollPosition"
      );
      return savedScrollPosition ? Number(savedScrollPosition) : 0;
    }
    return 0;
  }, [sessionsListExpanded]);

  const saveScrollPosition = useCallback(
    debounce((scrollOffset: number) => {
      if (sessionsListExpanded && CookieManager.arePreferenceCookiesAllowed()) {
        localStorage.setItem(
          "sessionsListScrollPosition",
          String(scrollOffset)
        );
      }
    }, 200),
    [sessionsListExpanded]
  );

  useEffect(() => {
    if (infiniteLoaderRef.current && sessions.length) {
      infiniteLoaderRef.current.resetloadMoreItemsCache();
    }
  }, [sessions]);

  useLayoutEffect(() => {
    function updateSize() {
      if (listContainerRef.current) {
        const newDimensions = {
          width: listContainerRef.current.offsetWidth,
          height: listContainerRef.current.offsetHeight,
        };
        setListDimensions(newDimensions);
        // Only set dimensions ready if we have valid dimensions
        if (newDimensions.width > 0 && newDimensions.height > 0) {
          setDimensionsReady(true);
        }
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

  const itemSize = isIndoor ? 100 : 130;

  const listHeight = dimensionsReady ? listDimensions.height : 400;
  const listWidth = dimensionsReady ? listDimensions.width : 230;

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
      isIndoor,
      isDormant,
    }),
    [
      sessions,
      handleClick,
      handleMouseEnter,
      handleMouseLeave,
      isIndoor,
      isDormant,
    ]
  );

  useEffect(() => {
    // Clear saved scroll position when sessions list is collapsed
    if (!sessionsListExpanded && CookieManager.arePreferenceCookiesAllowed()) {
      localStorage.removeItem("sessionsListScrollPosition");
    }
  }, [sessionsListExpanded]);

  // Force re-render when dimensions become ready
  useEffect(() => {
    if (dimensionsReady && sessions.length > 0) {
      // Small delay to ensure the container is fully rendered
      const timer = setTimeout(() => {
        if (infiniteLoaderRef.current) {
          infiniteLoaderRef.current.resetloadMoreItemsCache();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dimensionsReady, sessions.length]);

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
          {sessions.length > 0 && (
            <InfiniteLoader
              ref={infiniteLoaderRef}
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  key={`${listHeight}-${listWidth}-${itemSize}`}
                  className="List"
                  height={listHeight}
                  itemCount={itemCount}
                  itemSize={itemSize}
                  width={listWidth}
                  itemData={itemData}
                  onScroll={(scrollArgs: ListOnScrollProps) =>
                    saveScrollPosition(scrollArgs.scrollOffset)
                  }
                  ref={ref}
                  initialScrollOffset={initialScrollOffset}
                  onItemsRendered={onItemsRendered}
                >
                  {Row}
                </List>
              )}
            </InfiniteLoader>
          )}
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
