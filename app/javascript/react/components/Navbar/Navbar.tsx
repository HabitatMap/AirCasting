import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import * as S from "./Navbar.style";

import { LatLngLiteral, Map } from "../../types/googleMaps";
import { DEFAULT_MAP_CENTER } from "../../const/coordinates";

import DesktopHeader from "./DesktopHeader";
import { MobileCalendarHeader, MobileHeader } from "./MobileHeader";
import { urls } from "../../const/urls";

const Navbar = () => {
  const [navMenuVisible, setNavMenuVisible] = useState(false);
  const [location, setLocation] = useState<LatLngLiteral>(DEFAULT_MAP_CENTER);
  const mapRef = useRef<Map>();
  const { t } = useTranslation();

  const isMapPage = window.location.pathname === urls.reactMap;

  const toggleMenuVisibility = () => setNavMenuVisible(!navMenuVisible);

  return (
    <S.Header>
      {isMapPage ? (
        <MobileHeader
          setLocation={setLocation}
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
        setLocation={setLocation}
        mapRef={mapRef as React.RefObject<Map>}
      />
    </S.Header>
  );
};

export { Navbar };
