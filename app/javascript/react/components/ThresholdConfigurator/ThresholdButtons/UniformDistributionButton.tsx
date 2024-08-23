import React from "react";
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
  const { sessionId } = useMapParams();
  const { t } = useTranslation();

  const mobileStream = useAppSelector((state: RootState) => state.mobileStream);
  const fixedStream = useAppSelector((state: RootState) => state.fixedStream);
  const calendarMinMax = useAppSelector(selectMovingCalendarMinMax);
  const defaultButtonText = t(
    "thresholdConfigurator.uniformDistributionButtonDesktop"
  );

  const streamMinMaxValues = React.useMemo(() => {
    return calculateMinMaxValues(mobileStream, fixedStream, sessionId);
  }, [mobileStream, fixedStream, sessionId]);

  const combinedMinMaxValues = React.useMemo(() => {
    const allMinValues = [streamMinMaxValues?.min, calendarMinMax?.min].filter(
      (value) => value !== null && value !== undefined
    );

    const allMaxValues = [streamMinMaxValues?.max, calendarMinMax?.max].filter(
      (value) => value !== null && value !== undefined
    );

    const min = allMinValues.length > 0 ? Math.min(...allMinValues) : null;
    const max = allMaxValues.length > 0 ? Math.max(...allMaxValues) : null;

    if (min === null || max === null) {
      return null;
    }

    return { min, max };
  }, [streamMinMaxValues, calendarMinMax]);

  const distributeThresholds = () => {
    if (!combinedMinMaxValues) {
      hasErrorMessage(t("thresholdConfigurator.noValidDataErrorMessage"));
      console.error("No valid data available to distribute thresholds.");

      setTimeout(() => {
        hasErrorMessage("");
      }, 3000);

      return;
    }

    const { min, max } = combinedMinMaxValues;

    if (min === max) {
      hasErrorMessage(t("thresholdConfigurator.sameValuesError"));
      console.error(
        "While using discrete uniform distribution, the Min and Max values cannot both be the same."
      );

      setTimeout(() => {
        hasErrorMessage("");
      }, 3000);

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
