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
  onCellMouseLeave?: () => void;
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

  const handleMouseLeave = () => {
    if (onCellMouseLeave) {
      onCellMouseLeave();
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
    </S.SessionListViewStyle>
  );
};

export { SessionsListView };
export { SessionListEntity };
