import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import returnArrow from "../../assets/icons/returnArrow.svg";
import returnArrowDarkBlue from "../../assets/icons/returnArrowDarkBlue.svg";
import * as colors from "../../assets/styles/colors";
import { resetUserThresholds } from "../../store/thresholdSlice";
import * as S from "./ThresholdConfigurator.style";

enum ResetButtonVariant {
  IconOnly = "iconOnly",
  TextWithIcon = "textWithIcon",
}

interface ResetButtonProps {
  variant: ResetButtonVariant;
  resetButtonText?: string;
  swapIconTextPosition?: boolean;
  useDarkBlueIcon?: boolean;
}

const ResetButton: React.FC<ResetButtonProps> = ({
  variant = "iconOnly",
  resetButtonText,
  swapIconTextPosition = false,
  useDarkBlueIcon = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const icon = useDarkBlueIcon ? returnArrowDarkBlue : returnArrow;
  const resetButtonTextColor = useDarkBlueIcon
    ? colors.darkBlue
    : colors.gray300;
  const resetButtonDefaultText = t("thresholdConfigurator.resetButton", {
    defaultValue: "Reset",
  });
  const finalResetButtonText = resetButtonText || resetButtonDefaultText;

  const resetThresholds = () => {
    dispatch(resetUserThresholds());
  };

  const buttonContent = useMemo(() => {
    if (variant === ResetButtonVariant.TextWithIcon) {
      return swapIconTextPosition ? (
        <>
          {finalResetButtonText}
          <img src={icon} alt={t("thresholdConfigurator.altResetButton")} />
        </>
      ) : (
        <>
          <img src={icon} alt={t("thresholdConfigurator.altResetButton")} />
          {finalResetButtonText}
        </>
      );
    }
    return <img src={icon} alt={t("thresholdConfigurator.altResetButton")} />;
  }, [variant, swapIconTextPosition, finalResetButtonText, icon, t]);

  if (variant === ResetButtonVariant.TextWithIcon) {
    return (
      <S.ResetButton
        onClick={resetThresholds}
        style={{ color: resetButtonTextColor }}
      >
        {buttonContent}
      </S.ResetButton>
    );
  }

  return (
    <S.ThresholdResetButton onClick={resetThresholds}>
      {buttonContent}
    </S.ThresholdResetButton>
  );
};

export { ResetButton, ResetButtonVariant };
