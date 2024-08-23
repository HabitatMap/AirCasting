import React, { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store";
import { UniformDistributionIcon } from "./Icons/UniformDistributionIcon";
import { ThresholdButton, ThresholdButtonVariant } from "./ThresholdButton";
import {
  calculateMinMaxValues,
  calculateUniformThresholds,
} from "../../../utils/uniformDistributionThresholdCalc";
import { setUserThresholdValues } from "../../../store/thresholdSlice";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { useTranslation } from "react-i18next";
import { selectMovingCalendarMinMax } from "../../../store/movingStreamSelectors";
import { UserSettings } from "../../../types/userStates";

interface UniformDistributionButtonProps {
  variant?: ThresholdButtonVariant;
  uniformDistributionButtonText?: string;
  swapIconTextPosition?: boolean;
  useDarkBlueIcon?: boolean;
  hasErrorMessage: (message: string) => void;
}

const UniformDistributionButton: React.FC<UniformDistributionButtonProps> = ({
  variant = ThresholdButtonVariant.IconOnly,
  uniformDistributionButtonText,
  swapIconTextPosition = false,
  useDarkBlueIcon = false,
  hasErrorMessage,
}) => {
  const dispatch = useAppDispatch();
  const { sessionId, currentUserSettings } = useMapParams();
  const { t } = useTranslation();

  const mobileStream = useAppSelector((state: RootState) => state.mobileStream);
  const fixedStream = useAppSelector((state: RootState) => state.fixedStream);
  const calendarMinMaxValues = useAppSelector(selectMovingCalendarMinMax);

  const defaultButtonText = t(
    "thresholdConfigurator.uniformDistributionButtonDesktop"
  );
  const isCalendarView = currentUserSettings === UserSettings.CalendarView;

  const streamMinMaxValues = useMemo(() => {
    return calculateMinMaxValues(mobileStream, fixedStream, sessionId);
  }, [mobileStream, fixedStream, sessionId]);

  const minMaxValues = useMemo(() => {
    const minMax = isCalendarView ? calendarMinMaxValues : streamMinMaxValues;
    const min = minMax?.min ?? null;
    const max = minMax?.max ?? null;
    return min !== null && max !== null ? { min, max } : null;
  }, [isCalendarView, streamMinMaxValues, calendarMinMaxValues]);

  const distributeThresholds = () => {
    if (!minMaxValues) {
      hasErrorMessage(t("thresholdConfigurator.noValidDataErrorMessage"));
      console.error("No valid data available to distribute thresholds.");
      setTimeout(() => hasErrorMessage(""), 3000);
      return;
    }

    const { min, max } = minMaxValues;

    if (min === max) {
      hasErrorMessage(t("thresholdConfigurator.sameValuesError"));
      console.error(
        "While using discrete uniform distribution, the Min and Max values cannot both be the same."
      );
      setTimeout(() => hasErrorMessage(""), 3000);
      return;
    }

    const thresholds = calculateUniformThresholds(min, max);
    dispatch(setUserThresholdValues(thresholds));
  };

  const buttonText = uniformDistributionButtonText || defaultButtonText;

  return (
    <ThresholdButton
      variant={variant}
      buttonText={buttonText}
      swapIconTextPosition={swapIconTextPosition}
      useDarkBlueIcon={useDarkBlueIcon}
      IconComponent={UniformDistributionIcon}
      onClick={distributeThresholds}
    />
  );
};

export { UniformDistributionButton };
