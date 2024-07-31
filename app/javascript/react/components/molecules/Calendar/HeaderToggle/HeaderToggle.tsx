import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import headerArrowIcon from "../../../../assets/icons/headerArrowIcon.svg";
import useMobileDetection from "../../../../utils/useScreenSizeDetection";
import * as S from "./HeaderToggle.style";

interface Props {
  titleText: string | JSX.Element;
  startDate?: string;
  endDate?: string;
  componentToToggle: JSX.Element;
  isMapPage?: boolean;
}

const HeaderToggle = ({
  titleText,
  startDate,
  endDate,
  componentToToggle,
}: Props) => {
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMobileDetection();
  const { t } = useTranslation();

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {isMobile && (
        <S.Container>
          <S.RotatedIcon
            src={headerArrowIcon}
            alt={t("headerToggle.arrowIcon")}
            $rotated={!isVisible}
            onClick={toggleVisibility}
          />
          <S.Heading onClick={toggleVisibility}>{titleText}</S.Heading>
        </S.Container>
      )}

      {!isMobile && (
        <S.Container>
          <S.Heading>
            {titleText}
            {startDate && endDate && (
              <S.DateField>
                <span>{startDate}</span>
                <span>-</span>
                <span>{endDate}</span>
              </S.DateField>
            )}
          </S.Heading>
        </S.Container>
      )}

      {isVisible && componentToToggle}
    </>
  );
};

export default HeaderToggle;
