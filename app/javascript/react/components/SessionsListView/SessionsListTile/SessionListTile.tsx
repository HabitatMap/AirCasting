import moment from "moment";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import rightVector from "../../../assets/icons/rightVector.svg";
import { gray300 } from "../../../assets/styles/colors";
import { useAppSelector } from "../../../store/hooks";
import { selectIsDormantSessionsType } from "../../../store/sessionFiltersSlice";
import { selectThresholds } from "../../../store/thresholdSlice";
import { DateFormat } from "../../../types/dateFormat";
import { SensorPrefix } from "../../../types/sensors";
import { getColorForValue } from "../../../utils/thresholdColors";
import * as S from "./SessionListTile.style";

interface SessionListTile {
  id: number;
  sessionName: string;
  sensorName: string;
  averageValue: number | string;
  startTime: string;
  endTime: string;
  streamId: number;
  lastMeasurementValue?: number;
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
  lastMeasurementValue,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const thresholds = useSelector(selectThresholds);

  const { t } = useTranslation();

  const [formattedStartDate, formattedStartTime] = moment(
    startTime,
    DateFormat.default_with_time
  )
    .format(DateFormat.us_with_time)
    .split(" ");
  const [formattedEndDate, formattedEndTime] = moment(
    endTime,
    DateFormat.default_with_time
  )
    .format(DateFormat.us_with_time)
    .split(" ");

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

  const isDormant = useAppSelector(selectIsDormantSessionsType);
  const avg = sensorName.includes(SensorPrefix.AIR)
    ? averageValue
    : lastMeasurementValue;

  const dotColor = isDormant ? gray300 : getColorForValue(thresholds, avg);

  return (
    <S.SessionListTile
      onClick={handleClick}
      onMouseOver={handleMouseHover}
      onMouseLeave={handleMouseLeave}
    >
      <S.HorizontalSpacingContainer>
        <S.HorizontalGroup>
          <S.ColorDot $color={dotColor} />
          {typeof avg === "number" && <S.Subtitle>avg. {avg}</S.Subtitle>}
        </S.HorizontalGroup>
        <S.ArrowImageContainer>
          <img src={rightVector} alt={t("map.altDirect")} />
        </S.ArrowImageContainer>
      </S.HorizontalSpacingContainer>
      <S.Title>{sessionName}</S.Title>
      <S.Subtitle>{sensorName}</S.Subtitle>
      <S.Subtitle>
        <strong>{formattedStartDate}</strong> {formattedStartTime} -{" "}
        <strong>{formattedEndDate}</strong> {formattedEndTime}
      </S.Subtitle>
    </S.SessionListTile>
  );
};

export { SessionsListTile };
