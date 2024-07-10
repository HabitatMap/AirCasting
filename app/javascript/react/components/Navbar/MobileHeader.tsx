import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import airCastingLogoMobile from "../../assets/icons/airCastingLogoMobile.svg";
import backArrowIcon from "../../assets/icons/backArrowIcon.svg";
import hamburgerMobile from "../../assets/icons/hamburgerMobile.svg";
import { urls } from "../../const/urls";
import { RootState } from "../../store";
import { useAppDispatch } from "../../store/hooks";
import {
  selectUserSettingsState,
  updateUserSettings,
} from "../../store/userSettingsSlice";
import { UserSettings } from "../../types/userStates";
import { LocationSearch } from "../LocationSearch";
import { ControlPanel } from "../Map/ControlPanel/ControlPanel";
import { RefreshMapButton } from "../RefreshMapButton";
import * as S from "./Navbar.style";
import NavList from "./NavList/NavList";

export const MobileHeader = ({
  toggleMenuVisibility,
  navMenuVisible,
  t,
}: {
  toggleMenuVisibility: () => void;
  navMenuVisible: boolean;
  t: Function;
}) => {
  const { currentUserSettings, previousUserSettings } = useSelector(
    selectUserSettingsState
  );

  const dispatch = useAppDispatch();

  return (
    <S.MobileHeaderContainer>
      {currentUserSettings === UserSettings.ModalView ? (
        <S.GoBack
          onClick={() => {
            dispatch(updateUserSettings(previousUserSettings));
          }}
          aria-label={t("navbar.mapPage")}
        >
          <img
            src={backArrowIcon}
            alt={t("navbar.altGoBackIcon")}
            aria-label={t("navbar.goBackToSessions")}
          />
          {previousUserSettings === UserSettings.SessionListView
            ? t("navbar.goBackToSessions")
            : t("navbar.goBackToMap")}
        </S.GoBack>
      ) : (
        <>
          <S.MobileMenuContainer>
            <a
              href={urls.habitatMap}
              aria-label={t("navbar.sections.aircastingPage")}
            >
              <img alt={t("navbar.altLogo")} src={airCastingLogoMobile} />
            </a>
            <nav>
              <S.MenuButton onClick={toggleMenuVisibility}>
                <img
                  src={hamburgerMobile}
                  alt={t("navbar.altMenu")}
                  aria-label={t("navbar.sections.openMenu")}
                />
              </S.MenuButton>
            </nav>
          </S.MobileMenuContainer>
          <LocationSearch isMapPage={true} />
          <RefreshMapButton />
          <ControlPanel />
          {navMenuVisible && (
            <NavList
              t={t as (key: string) => string}
              navMenuVisible={navMenuVisible}
              toggleMenuVisibility={toggleMenuVisibility}
            />
          )}
        </>
      )}
    </S.MobileHeaderContainer>
  );
};

export const MobileCalendarHeader = ({ t }: { t: Function }) => {
  const sessionsListOpen = useSelector(
    (state: RootState) => state.map.sessionsListOpen
  );
  const { previousUserSettings } = useSelector(selectUserSettingsState);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (
    <S.MobileContainer>
      <S.GoBack
        onClick={() => {
          navigate(urls.reactMap);
          dispatch(updateUserSettings(previousUserSettings));
        }}
        aria-label={t("navbar.mapPage")}
      >
        <img
          src={backArrowIcon}
          alt={t("navbar.altGoBackIcon")}
          aria-label={t("navbar.goBackToSessions")}
        />
        {previousUserSettings === UserSettings.SessionListView
          ? t("navbar.goBackToSessions")
          : t("navbar.goBackToMap")}
      </S.GoBack>
    </S.MobileContainer>
  );
};
