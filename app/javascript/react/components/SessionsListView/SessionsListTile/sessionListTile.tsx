import * as React from "react";
import { useSelector } from "react-redux";
import moment from "moment";

import { getColorForValue } from "../../../utils/thresholdColors";
import { DateFormat } from "../../../types/dateFormat";
import { selectThreshold } from "../../../store/thresholdSlice";
import * as S from "./sessionListTile.style";

interface SessionListTile {
  id: number;
  sessionName: string;
  sensorName: string;
  averageValue: number;
  startTime: string;
  endTime: string;
  streamId: number;
  onClick?: (id: number, streamId: number) => void;
  onMouseEnter?: (id: number) => void;
  onMouseLeave?: () => void;
}

const SessionsListTile: React.FC<SessionListTile> = ({
  id,
  sessionName,
  sensorName,
  averageValue,
  startTime,
  endTime,
  streamId,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const thresholds = useSelector(selectThreshold);

  const [formattedStartDate, formattedStartTime] = moment(startTime, DateFormat.default).format(
    DateFormat.us_with_time
  ).split(' ');
  const [formattedEndDate, formattedEndTime] = moment(endTime, DateFormat.default).format(
    DateFormat.us_with_time
  ).split(' ');

  const handleClick = () => {
    if (onClick) {
      onClick(id, streamId);
    }
  };

  const handleMouseHover = () => {
    if (onMouseEnter) {
      onMouseEnter(id);
    }
  };

  const handleMouseLeave = () => {
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  return (
    <S.SessionListTile
      onClick={handleClick}
      onMouseOver={handleMouseHover}
      onMouseLeave={handleMouseLeave}
    >
      <S.HorizontalContainer>
        {/* adjust thershold value so dot can have proper color */}
        <S.ColorDot color={getColorForValue(thresholds, 30)} />
        <S.Subtitle>avg. {averageValue}</S.Subtitle>
      </S.HorizontalContainer>
      <S.Title>{sessionName}</S.Title>
      <S.Subtitle>{sensorName}</S.Subtitle>
      <S.Subtitle>
      <strong>{formattedStartDate}</strong> {formattedStartTime} - <strong>{formattedEndDate}</strong> {formattedEndTime}
      </S.Subtitle>
    </S.SessionListTile>
  );
};

export { SessionsListTile };
