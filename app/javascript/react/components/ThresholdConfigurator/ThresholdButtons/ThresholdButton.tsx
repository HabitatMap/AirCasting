import React, { useMemo } from "react";
import * as S from "./../ThresholdConfigurator.style"; // Import your styled components
import * as colors from "../../../assets/styles/colors";

enum ThresholdButtonVariant {
  IconOnly = "iconOnly",
  TextWithIcon = "textWithIcon",
}

interface ThresholdButtonProps {
  variant?: ThresholdButtonVariant;
  buttonText?: string;
  swapIconTextPosition?: boolean;
  useDarkBlueIcon?: boolean;
  IconComponent: React.ComponentType<{ color?: string }>;
  onClick: () => void;
}

const ThresholdButton: React.FC<ThresholdButtonProps> = ({
  variant = ThresholdButtonVariant.IconOnly,
  buttonText,
  swapIconTextPosition = false,
  useDarkBlueIcon = false,
  IconComponent,
  onClick,
}) => {
  const iconColor = useDarkBlueIcon ? colors.darkBlue : undefined;
  const buttonTextColor = useDarkBlueIcon ? colors.darkBlue : colors.gray300;

  const buttonContent = useMemo(() => {
    if (variant === ThresholdButtonVariant.TextWithIcon) {
      return (
        <S.ThresholdButtonWrapper>
          {swapIconTextPosition ? (
            <>
              {buttonText}
              <IconComponent color={iconColor} />
            </>
          ) : (
            <>
              <IconComponent color={iconColor} />
              {buttonText}
            </>
          )}
        </S.ThresholdButtonWrapper>
      );
    }
    return <IconComponent color={iconColor} />;
  }, [variant, swapIconTextPosition, buttonText, IconComponent, iconColor]);

  return (
    <S.ThresholdButton
      onClick={onClick}
      style={{ color: buttonTextColor }}
      variant={variant}
    >
      {buttonContent}
    </S.ThresholdButton>
  );
};

export { ThresholdButton, ThresholdButtonVariant };
