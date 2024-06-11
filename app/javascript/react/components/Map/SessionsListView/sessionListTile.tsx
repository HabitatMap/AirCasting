import * as React from "react";
import * as S from "./sessionListTile.style";

interface SessionListTile {
  sessionName: string;
  sensorName: string;
  startTime: string;
  endTime: string;
}

const SessionsListTile: React.FC<SessionListTile> = ({
  sessionName,
  sensorName,
  startTime,
  endTime,
}) => {
  return (
    <S.SessionListTile>
      <S.HorizontalContainer>
        <S.RedDot />
        <S.Subtitle>
          <text>avg. 80899</text>
        </S.Subtitle>
      </S.HorizontalContainer>
      <S.Title>{sessionName}</S.Title>
      <S.Subtitle>{sensorName}</S.Subtitle>
      {/* <text>{startTime} - {endTime}</text>  */}
    </S.SessionListTile>
  );
};

export { SessionsListTile };
