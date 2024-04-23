import React, { useState } from "react";
import { Heading } from "../../../pages/CalendarPage/CalendarPage.style";

interface Props {
  titleText: string; // Text for the title
  componentToToggle: JSX.Element; // Component to toggle
}

const HeaderToggle: React.FC<Props> = ({ titleText, componentToToggle }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div>
      {/* Clickable heading */}
      <Heading onClick={toggleVisibility}>{titleText}</Heading>
      {/* Component that will be shown/hidden */}
      {isVisible && componentToToggle}
    </div>
  );
};

export default HeaderToggle;
