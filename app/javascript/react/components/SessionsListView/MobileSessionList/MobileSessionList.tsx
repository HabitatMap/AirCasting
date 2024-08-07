import * as React from "react";
import { useTranslation } from "react-i18next";

import closeImage from "../../../assets/icons/closeButton.svg";
import { SessionsListTile } from "../SessionsListTile/SessionListTile";
import { SessionListEntity } from "../SessionsListView";
import * as S from "./MobileSessionList.style";

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
  const { t } = useTranslation();

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
            <S.Image src={closeImage} alt={t("map.altClose")} />
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
