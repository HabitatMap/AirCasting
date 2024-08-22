import React from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../../../store/hooks";
import { resetUserThresholds } from "../../../store/thresholdSlice";
import { ThresholdButton, ThresholdButtonVariant } from "./ThresholdButton";
import { ReturnArrowIcon } from "./Icons/ReturnArrowIcon";

interface ResetButtonProps {
  variant?: ThresholdButtonVariant;
  resetButtonText?: string;
  swapIconTextPosition?: boolean;
  useDarkBlueIcon?: boolean;
}

const ResetButton: React.FC<ResetButtonProps> = ({
  variant = ThresholdButtonVariant.IconOnly,
  resetButtonText,
  swapIconTextPosition = false,
  useDarkBlueIcon = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const resetButtonDefaultText = t("thresholdConfigurator.resetButtonDesktop");
  const finalResetButtonText = resetButtonText || resetButtonDefaultText;

  const resetThresholds = () => {
    dispatch(resetUserThresholds());
  };

  return (
    <ThresholdButton
      variant={variant}
      buttonText={finalResetButtonText}
      swapIconTextPosition={swapIconTextPosition}
      useDarkBlueIcon={useDarkBlueIcon}
      IconComponent={ReturnArrowIcon}
      onClick={resetThresholds}
    />
  );
};

export { ResetButton };
