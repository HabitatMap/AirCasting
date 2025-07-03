import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { UserSettings } from "../../../types/userStates";
import { useMapParams } from "../../../utils/mapParamsHandler";
import { CookieSettingsModal } from "../../organisms/Modals/CookieSettingsModal/CookieSettingsModal";
import DesktopHeader from "./DesktopHeader";
import { MobileCalendarHeader, MobileHeader } from "./MobileHeader";
import * as S from "./Navbar.style";

interface NavbarProps {
  isMapPage: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isMapPage }) => {
  const [navMenuVisible, setNavMenuVisible] = useState<boolean>(false);
  const [cookieSettingsModalOpen, setCookieSettingsModalOpen] =
    useState<boolean>(false);
  const { t } = useTranslation();
  const { currentUserSettings } = useMapParams();

  const isTimelapseView = currentUserSettings === UserSettings.TimelapseView;

  const toggleMenuVisibility = () => setNavMenuVisible(!navMenuVisible);

  const handleOpenCookieSettings = () => {
    setCookieSettingsModalOpen(true);
    setNavMenuVisible(false); // Close the nav menu when opening cookie settings
  };

  const handleCloseCookieSettings = () => {
    setCookieSettingsModalOpen(false);
  };

  return (
    <S.Header>
      {isMapPage ? (
        <MobileHeader
          isTimelapseView={isTimelapseView}
          toggleMenuVisibility={toggleMenuVisibility}
          navMenuVisible={navMenuVisible}
          t={t}
          onOpenCookieSettings={handleOpenCookieSettings}
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
        onOpenCookieSettings={handleOpenCookieSettings}
      />
      <CookieSettingsModal
        isOpen={cookieSettingsModalOpen}
        onClose={handleCloseCookieSettings}
      />
    </S.Header>
  );
};

export { Navbar };
