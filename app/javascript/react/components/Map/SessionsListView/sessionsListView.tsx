import * as React from "react";
import { SessionsListTile } from "./sessionListTile";
import * as S from "./sessionListView.style";

interface SessionListEntity {
  sessionName: string;
  sensorName: string;
  startTime: string;
  endTime: string;
}

interface SessionListViewProps {
  sessions: SessionListEntity[];
}

const SessionsListView: React.FC<SessionListViewProps> = ({ sessions }) => {
  return (
    <S.SessionListViewStyle>
      {sessions.map((session, index) => (
        <div key={index}>
          <SessionsListTile
            sessionName={session.sessionName}
            sensorName={session.sensorName}
            startTime={session.startTime}
            endTime={session.endTime}
          />
        </div>
      ))}
    </S.SessionListViewStyle>
  );
};

export { SessionsListView };
export { SessionListEntity };
