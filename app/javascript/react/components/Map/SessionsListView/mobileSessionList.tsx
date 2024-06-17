import * as React from "react";
import * as S from "./mobileSessionList.style";
import closeImage from "../../../assets/icons/closeButton.svg";
import { SessionListEntity } from "./sessionsListView";
import { SessionsListTile } from "./sessionListTile";

interface MobileSessionListProps {
  sessions: SessionListEntity[];
  onClose: () => void;
}

const MobileSessionList: React.FC<MobileSessionListProps> = ({
  sessions,
  onClose,
}) => {
  return (
    <S.Overlay>
      <S.VerticalContainer>
        <S.HorizontalContainer>
          <S.ImageButton onClick={onClose}>
            <S.Image src={closeImage} alt="Close" />
          </S.ImageButton>
          <S.Title>Sessions list ({sessions.length})</S.Title>
        </S.HorizontalContainer>
        <S.SessionListStyled>
          {sessions.map((session, index) => (
            <div key={index}>
              <SessionsListTile
                id={session.id}
                sessionName={session.sessionName}
                sensorName={session.sensorName}
                averageValue={session.averageValue}
                startTime={session.startTime}
                endTime={session.endTime}
                streamId={session.streamId}
              />
            </div>
          ))}
        </S.SessionListStyled>
      </S.VerticalContainer>
    </S.Overlay>
  );
};

export { MobileSessionList };
