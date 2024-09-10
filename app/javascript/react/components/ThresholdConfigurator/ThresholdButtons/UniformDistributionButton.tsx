import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { selectMeasurementsExtremes } from "../../../store/measurementsSelectors";
import { selectMovingCalendarMinMax } from "../../../store/movingStreamSelectors";
import { setUserThresholdValues } from "../../../store/thresholdSlice";
import { UserSettings } from "../../../types/userStates";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { calculateUniformThresholds } from "../../../utils/uniformDistributionThresholdCalc";
import { UniformDistributionIcon } from "./Icons/UniformDistributionIcon";
import { ThresholdButton, ThresholdButtonVariant } from "./ThresholdButton";

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
  const { currentUserSettings } = useMapParams();
  const { t } = useTranslation();

  const measurementExtremes = useAppSelector(selectMeasurementsExtremes);
  const calendarMinMaxValues = useAppSelector(selectMovingCalendarMinMax);

  const defaultButtonText = t(
    "thresholdConfigurator.uniformDistributionButtonDesktop"
  );
  const isCalendarView = currentUserSettings === UserSettings.CalendarView;

  const minMaxValues = useMemo(() => {
    if (isCalendarView) {
      return calendarMinMaxValues;
    } else {
      const { minMeasurementValue, maxMeasurementValue } = measurementExtremes;
      return minMeasurementValue !== null && maxMeasurementValue !== null
        ? { min: minMeasurementValue, max: maxMeasurementValue }
        : null;
    }
  }, [isCalendarView, measurementExtremes, calendarMinMaxValues]);

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

    const thresholds = calculateUniformThresholds(min as number, max as number);
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
