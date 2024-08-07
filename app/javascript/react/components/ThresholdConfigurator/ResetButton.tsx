import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import returnArrow from "../../assets/icons/returnArrow.svg";
import returnArrowDarkBlue from "../../assets/icons/returnArrowDarkBlue.svg";
import * as colors from "../../assets/styles/colors";
import { useAppSelector } from "../../store/hooks";
import { selectDefaultThresholds } from "../../store/thresholdSlice";
import { useMapParams } from "../../utils/mapParamsHandler";
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
  variant = ResetButtonVariant.IconOnly,
  resetButtonText,
  swapIconTextPosition = false,
  useDarkBlueIcon = false,
}) => {
  const { t } = useTranslation();
  const icon = useDarkBlueIcon ? returnArrowDarkBlue : returnArrow;
  const resetButtonTextColor = useDarkBlueIcon
    ? colors.darkBlue
    : colors.gray300;
  const resetButtonDefaultText = t("thresholdConfigurator.resetButtonDesktop");
  const finalResetButtonText = resetButtonText || resetButtonDefaultText;
  const altResetButtonText = t("thresholdConfigurator.altResetButton");
  const { setThresholds } = useMapParams();
  const defaultThresholds = useAppSelector(selectDefaultThresholds);

  const resetThresholds = () => {
    setThresholds(defaultThresholds);
  };

  const buttonContent = useMemo(() => {
    if (variant === ResetButtonVariant.TextWithIcon) {
      return (
        <S.ResetButtonWrapper>
          {swapIconTextPosition ? (
            <>
              {finalResetButtonText}
              <img src={icon} alt={altResetButtonText} />
            </>
          ) : (
            <>
              <img src={icon} alt={altResetButtonText} />
              {finalResetButtonText}
            </>
          )}
        </S.ResetButtonWrapper>
      );
    }
    return <img src={icon} alt={altResetButtonText} />;
  }, [
    variant,
    swapIconTextPosition,
    finalResetButtonText,
    icon,
    altResetButtonText,
  ]);

  return (
    <S.ResetButton
      onClick={resetThresholds}
      style={{ color: resetButtonTextColor }}
      variant={variant}
    >
      {buttonContent}
    </S.ResetButton>
  );
};

export { ResetButton, ResetButtonVariant };
