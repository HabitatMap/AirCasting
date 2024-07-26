import * as React from "react";
import { useTranslation } from "react-i18next";
import { ExportDataComponent } from "../Popups/ExportDataComponent";
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

const SessionsListView: React.FC<SessionsListViewProps> = ({
  sessions,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave,
}) => {
  const { t } = useTranslation();
  const results = sessions.length;
  const sessionsIds = sessions.map((session) => session.id.toString());

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

  return (
    <S.SessionListViewStyle>
      <S.SessionInfoTile>
        <S.SessionListInfoContainer>
          <S.SessionListTitle>{t("map.listSessions")}</S.SessionListTitle>
          <S.SessionListTitle>
            {t("map.results", { results: results })}
          </S.SessionListTitle>
        </S.SessionListInfoContainer>

        <ExportDataComponent
          button={
            <S.ExportSessionsButton>
              {t("map.exportButton")}
            </S.ExportSessionsButton>
          }
          sessionsIds={sessionsIds}
          isIconOnly
          onSubmit={(formData) => {}}
          fixedSessionTypeSelected={true}
          isSessionList={true}
        />
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
              onClick={(id, streamId) => {
                handleClick(id, streamId);
              }}
              onMouseEnter={(id) => {
                handleMouseEnter(id);
              }}
              onMouseLeave={() => {
                handleMouseLeave();
              }}
            />
          </div>
        ))}
      </S.SessionListContainer>
    </S.SessionListViewStyle>
  );
};

export { SessionsListView };
