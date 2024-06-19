import * as React from "react";
import * as S from "./mobileSessionList.style";
import closeImage from "../../../assets/icons/closeButton.svg";
import { SessionListEntity } from "./sessionsListView";
import { SessionsListTile } from "./sessionListTile";

interface MobileSessionListProps {
  sessions: SessionListEntity[];
  onCellClick?: (id: number, streamId: number) => void;
  onClose: () => void;
}

const MobileSessionList: React.FC<MobileSessionListProps> = ({
  sessions,
  onCellClick,
  onClose,
}) => {

  const handleClick = (id: number, streamId: number) => {
    if (onCellClick) {
      onCellClick(id, streamId);
    }
  };

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
                onClick={(id, streamId) => {
                  handleClick(id, streamId);
                }}
              />
            </div>
          ))}
        </S.SessionListStyled>
      </S.VerticalContainer>
    </S.Overlay>
  );
};

export { MobileSessionList };
