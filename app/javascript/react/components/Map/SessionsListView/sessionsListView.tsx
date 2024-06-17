import * as React from "react";
import { SessionsListTile } from "./sessionListTile";
import * as S from "./sessionListView.style";

interface SessionListEntity {
  id: number;
  sessionName: string;
  sensorName: string;
  averageValue: number;
  startTime: string;
  endTime: string;
  streamId: number;
}

interface SessionListViewProps {
  sessions: SessionListEntity[];
  onCellClick?: (id: number, streamId: number) => void;
  onCellMouseEnter?: (id: number) => void;
  onCellMouseLeave?: (id: number) => void;
}

const SessionsListView: React.FC<SessionListViewProps> = ({
  sessions,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave
}) => {

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

  const handleMouseLeave = (id: number) => {
    if (onCellMouseLeave) {
      onCellMouseLeave(id);
    }
  };

  return (
    <S.SessionListViewStyle>
      {sessions.map((session) => (
        <div key={session.id}>
          <SessionsListTile
            id={session.id}
            sessionName={session.sessionName}
            sensorName={session.sensorName}
            averageValue={session.averageValue}
            startTime={session.startTime}
            endTime={session.endTime}
            onClick={(id, streamId) => {
              handleClick(id, streamId);
            }}
            onMouseEnter={(id) => {
              handleMouseEnter(id);
            }}
            onMouseLeave={(id) => {
              handleMouseLeave(id);
            }}
          />
        </div>
      ))}
    </S.SessionListViewStyle>
  );
};

export { SessionsListView };
export { SessionListEntity };
