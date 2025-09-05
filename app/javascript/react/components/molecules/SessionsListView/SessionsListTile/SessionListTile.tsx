import moment from "moment";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import rightVector from "../../../../assets/icons/rightVector.svg";
import { gray300 } from "../../../../assets/styles/colors";
import { useAppSelector } from "../../../../store/hooks";
import { selectIsDormantSessionsType } from "../../../../store/sessionFiltersSlice";
import { selectThresholds } from "../../../../store/thresholdSlice";
import { DateFormat } from "../../../../types/dateFormat";
import { getColorForValue } from "../../../../utils/thresholdColors";
import * as S from "./SessionListTile.style";

interface SessionListTile {
  id: number;
  sessionName: string;
  sensorName: string;
  averageValue: number | null | string;
  startTime: string;
  endTime: string;
  streamId: number;
  onClick?: (id: number, streamId: number) => void;
  onMouseEnter?: (id: number) => void;
  onMouseLeave?: () => void;
  isIndoor?: boolean;
  isDormant?: boolean;
}

const AverageValueDisplay: React.FC<{
  averageValue: number | null | string;
}> = ({ averageValue }) => {
  if (typeof averageValue === "number") {
    return <S.Subtitle>avg. {averageValue}</S.Subtitle>;
  }
  const { t } = useTranslation();
  return <S.Subtitle>avg. {t("map.calculating")}</S.Subtitle>;
};

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
  isIndoor,
  isDormant,
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

  const isDormantSession = useAppSelector(selectIsDormantSessionsType);

  const dotColor = isDormantSession
    ? gray300
    : getColorForValue(thresholds, averageValue);

  const shouldShowValue = !(isIndoor || (isDormant && averageValue === null));

  return (
    <S.SessionListTile
      $isIndoor={isIndoor}
      onClick={handleClick}
      onMouseOver={handleMouseHover}
      onMouseLeave={handleMouseLeave}
    >
      <S.HorizontalSpacingContainer $isIndoor={isIndoor}>
        <S.HorizontalGroup>
          {shouldShowValue && (
            <S.ColorDot
              $color={dotColor}
              $isAvg={typeof averageValue === "number"}
            />
          )}
          {shouldShowValue && (
            <AverageValueDisplay averageValue={averageValue} />
          )}
        </S.HorizontalGroup>
        <S.ArrowImageContainer>
          <img src={rightVector} alt={t("map.altDirect")} />
        </S.ArrowImageContainer>
      </S.HorizontalSpacingContainer>
      <S.Title $isIndoor={isIndoor}>{sessionName}</S.Title>
      <S.Subtitle $isIndoor={isIndoor}>{sensorName}</S.Subtitle>
      <S.Subtitle $isIndoor={isIndoor}>
        <strong>{formattedStartDate}</strong> {formattedStartTime} -{" "}
        <strong>{formattedEndDate}</strong> {formattedEndTime}
      </S.Subtitle>
    </S.SessionListTile>
  );
};

export { SessionsListTile };
