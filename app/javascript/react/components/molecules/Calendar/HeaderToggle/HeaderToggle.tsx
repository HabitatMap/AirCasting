import React, { useEffect, useState } from "react";
import { screenSizes } from "../../../../utils/media";
import { Container, RotatedIcon, Heading } from "./HeaderToggle.style";
import arrowIcon from "../../../../assets/icons/arrowIcon.svg";

interface Props {
  titleText: string;
  componentToToggle: JSX.Element;
}

const HeaderToggle: React.FC<Props> = ({ titleText, componentToToggle }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isRotated, setIsRotated] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < screenSizes.mobile
  );
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    setIsRotated(!isRotated);
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

  return (
    <div>
      <Container>
        {isMobile && (
          <RotatedIcon
            src={arrowIcon}
            alt="Arrow Icon"
            rotated={isRotated}
            onClick={toggleVisibility}
          />
        )}
        <Heading onClick={toggleVisibility}>{titleText}</Heading>
      </Container>
      {isVisible && componentToToggle}
    </div>
  );
};

export default HeaderToggle;
