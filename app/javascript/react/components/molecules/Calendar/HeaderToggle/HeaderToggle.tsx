import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Container, RotatedIcon, Heading } from "./HeaderToggle.style";
import { screenSizes } from "../../../../utils/media";
import headerArrowIcon from "../../../../assets/icons/headerArrowIcon.svg";

interface Props {
  titleText: string;
  componentToToggle: JSX.Element;
}

const HeaderToggle: React.FC<Props> = ({ titleText, componentToToggle }) => {
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
      <Container>
        {(isMobile && (
          <>
            <RotatedIcon
              src={headerArrowIcon}
              alt={t("headerToggle.arrowIcon")}
              rotated={!isVisible}
              onClick={toggleVisibility}
            />
            <Heading onClick={toggleVisibility}>{titleText}</Heading>
          </>
        )) || <Heading>{titleText}</Heading>}
      </Container>
      {isVisible && componentToToggle}
    </div>
  );
};

export default HeaderToggle;
