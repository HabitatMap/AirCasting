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

interface UniformDistributionButtonProps {
  variant?: ThresholdButtonVariant;
  swapIconTextPosition?: boolean;
  useDarkBlueIcon?: boolean;
  hasErrorMessage: (message: string) => void;
}

const UniformDistributionButton: React.FC<UniformDistributionButtonProps> = ({
  variant = ThresholdButtonVariant.IconOnly,
  swapIconTextPosition = false,
  useDarkBlueIcon = false,
  hasErrorMessage,
}) => {
  const dispatch = useAppDispatch();
  const { sessionId } = useMapParams();
  const { t } = useTranslation();

  const mobileStream = useAppSelector((state: RootState) => state.mobileStream);
  const fixedStream = useAppSelector((state: RootState) => state.fixedStream);

  const minMaxValues = React.useMemo(() => {
    return calculateMinMaxValues(mobileStream, fixedStream, sessionId);
  }, [mobileStream, fixedStream, sessionId]);

  const distributeThresholds = () => {
    if (!minMaxValues) {
      return;
    }

    const { min, max } = minMaxValues;

    if (min === max) {
      hasErrorMessage(
        t("thresholdConfigurator.uniformDistributionErrorMessage")
      );
      console.error(
        "While using discrete uniform distribution the Min and Max values cannot both be the same"
      );

      setTimeout(() => {
        hasErrorMessage("");
      }, 3000);

      return;
    } else {
      hasErrorMessage("");
    }

    const thresholds = calculateUniformThresholds(min, max);
    dispatch(setUserThresholdValues(thresholds));
  };

  const uniformDistributionButtonText = t(
    "thresholdConfigurator.uniformDistributionButtonDesktop"
  );

  return (
    <ThresholdButton
      variant={variant}
      buttonText={uniformDistributionButtonText}
      swapIconTextPosition={swapIconTextPosition}
      useDarkBlueIcon={useDarkBlueIcon}
      IconComponent={UniformDistributionIcon}
      onClick={distributeThresholds}
    />
  );
};

export { UniformDistributionButton };
