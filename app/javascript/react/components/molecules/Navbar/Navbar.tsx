import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { UserSettings } from "../../../types/userStates";
import { useMapParams } from "../../../utils/mapParamsHandler";
import DesktopHeader from "./DesktopHeader";
import { MobileCalendarHeader, MobileHeader } from "./MobileHeader";
import * as S from "./Navbar.style";

interface NavbarProps {
  isMapPage: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isMapPage }) => {
  const [navMenuVisible, setNavMenuVisible] = useState<boolean>(false);
  const { t } = useTranslation();
  const { currentUserSettings } = useMapParams();

  const isTimelapseView = currentUserSettings === UserSettings.TimelapseView;

  const toggleMenuVisibility = () => setNavMenuVisible(!navMenuVisible);

  return (
    <S.Header>
      {isMapPage ? (
        <MobileHeader
          isTimelapseView={isTimelapseView}
          toggleMenuVisibility={toggleMenuVisibility}
          navMenuVisible={navMenuVisible}
          t={t}
        />
      ) : (
        <MobileCalendarHeader t={t} />
      )}
      <DesktopHeader
        isMapPage={isMapPage}
        isTimelapseView={isTimelapseView}
        navMenuVisible={navMenuVisible}
        toggleMenuVisibility={toggleMenuVisibility}
        t={t}
      />
    </S.Header>
  );
};

export { Navbar };
