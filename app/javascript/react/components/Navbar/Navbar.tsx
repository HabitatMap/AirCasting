import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import DesktopHeader from "./DesktopHeader";
import { MobileCalendarHeader, MobileHeader } from "./MobileHeader";
import * as S from "./Navbar.style";

interface NavbarProps {
  isMapPage: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isMapPage }) => {
  const [navMenuVisible, setNavMenuVisible] = useState<boolean>(false);
  const { t } = useTranslation();

  const toggleMenuVisibility = () => setNavMenuVisible(!navMenuVisible);

  return (
    <S.Header>
      {isMapPage ? (
        <MobileHeader
          toggleMenuVisibility={toggleMenuVisibility}
          navMenuVisible={navMenuVisible}
          t={t}
        />
      ) : (
        <MobileCalendarHeader t={t} />
      )}
      <DesktopHeader
        isMapPage={isMapPage}
        navMenuVisible={navMenuVisible}
        toggleMenuVisibility={toggleMenuVisibility}
        t={t}
      />
    </S.Header>
  );
};

export { Navbar };
