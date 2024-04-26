import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import * as S from "./HeaderToggle.style";
import { screenSizes } from "../../../../utils/media";
import headerArrowIcon from "../../../../assets/icons/headerArrowIcon.svg";
import returnArrow from "../../../../assets/icons/returnArrow.svg";

interface Props {
  titleText: string;
  componentToToggle: JSX.Element;
  resetThresholds?: () => void;
}

const HeaderToggle: React.FC<Props> = ({
  titleText,
  componentToToggle,
  resetThresholds,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < screenSizes.mobile
  );
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < screenSizes.mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { t } = useTranslation();

  return (
    <div>
      <S.Container>
        {(isMobile && (
          <>
            <S.RotatedIcon
              src={headerArrowIcon}
              alt={t("headerToggle.arrowIcon")}
              rotated={!isVisible}
              onClick={toggleVisibility}
            />
            <S.Heading onClick={toggleVisibility}>{titleText}</S.Heading>
          </>
        )) || <S.Heading>{titleText}</S.Heading>}
        {resetThresholds && (
          <S.ResetButton onClick={resetThresholds}>
            {t("thresholdConfigurator.resetButton")}
            <img
              src={returnArrow}
              alt={t("thresholdConfigurator.altResetButton")}
            />
          </S.ResetButton>
        )}
      </S.Container>
      {isVisible && componentToToggle}
    </div>
  );
};

export default HeaderToggle;
