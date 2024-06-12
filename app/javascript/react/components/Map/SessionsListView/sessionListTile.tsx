import * as React from "react";
import { useSelector } from "react-redux";
import * as S from "./sessionListTile.style";
import moment from "moment";
import { getColorForValue } from "../../../utils/thresholdColors";
import { DateFormat } from "../../../types/dateFormat";
import { selectThreshold } from "../../../store/thresholdSlice";

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

  const thresholds = useSelector(selectThreshold);

  const formattedStartTime: string = moment(startTime, "YYYY-MM-DD").format(DateFormat.us_with_time)
  const formattedEndTime: string = moment(endTime, "YYYY-MM-DD").format(DateFormat.us_with_time)

  return (
    <S.SessionListTile>
      <S.HorizontalContainer>
        <S.ColorDot color={getColorForValue(thresholds, 30)} />
        <S.Subtitle>
          <text>avg. 80899</text>
        </S.Subtitle>
      </S.HorizontalContainer>
      <S.Title>{sessionName}</S.Title>
      <S.Subtitle>{sensorName}</S.Subtitle>
      <text>{formattedStartTime} - {formattedEndTime}</text> 
    </S.SessionListTile>
  );
};

export { SessionsListTile };
