import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { urls } from "../../const/urls";
import DesktopHeader from "./DesktopHeader";
import { MobileCalendarHeader, MobileHeader } from "./MobileHeader";
import * as S from "./Navbar.style";

const Navbar = () => {
  const [navMenuVisible, setNavMenuVisible] = useState(false);
  const mapRef = useRef<Map>();
  const { t } = useTranslation();

  const isMapPage = window.location.pathname === urls.reactMap;

  const toggleMenuVisibility = () => setNavMenuVisible(!navMenuVisible);

  return (
    <S.Header>
      {isMapPage ? (
        <MobileHeader
          mapRef={mapRef as React.RefObject<Map>}
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
        mapRef={mapRef as React.RefObject<Map>}
      />
    </S.Header>
  );
};

export { Navbar };
