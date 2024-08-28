import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import { selectFixedSessionsList } from "../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../store/hooks";
import { SessionTypes } from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CopyLinkComponent } from "../Popups/CopyLinkComponent";
import { DesktopSessionFilters } from "../SessionFilters/DesktopSessionFilters";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

enum ButtonTypes {
  FILTER = "filter",
  TIMELAPSE = "timelapse",
  COPY_LINK = "copyLink",
  SHARE = "share",
}

const MapButtons = () => {
  const {
    goToUserSettings,
    currentUserSettings,
    previousUserSettings,
    sessionType,
  } = useMapParams();
  const [activeButtons, setActiveButtons] = useState<ButtonTypes[]>([]);

  const [activeCopyLinkButton, setActiveCopyLinkButton] = useState(false);

  const showFilters = activeButtons.includes(ButtonTypes.FILTER);

  const { t } = useTranslation();

  const listSessions = useAppSelector(selectFixedSessionsList);

  const isModalView = currentUserSettings === UserSettings.ModalView;
  const isTimelapseButtonVisible =
    !isModalView && sessionType === SessionTypes.FIXED;
  const isTimelapseDisabled = listSessions.length === 0;
  const isTimelapseButtonActive =
    activeButtons.includes(ButtonTypes.TIMELAPSE) &&
    currentUserSettings === UserSettings.TimelapseView;

  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      setActiveButtons([ButtonTypes.TIMELAPSE]);
    } else {
      setActiveButtons([ButtonTypes.FILTER]);
    }
  }, []);

  const handleCopyLinkClick = () => {
    setActiveCopyLinkButton(true);
    if (activeButtons.includes(ButtonTypes.FILTER)) {
      setActiveButtons([]);
    }
  };

  const handleTimelapseClick = () => {
    if (activeButtons.includes(ButtonTypes.TIMELAPSE)) {
      setActiveButtons([]);
      goToUserSettings(UserSettings.MapView);
    } else {
      setActiveButtons([ButtonTypes.TIMELAPSE]);
      goToUserSettings(UserSettings.TimelapseView);
    }
    setActiveCopyLinkButton(false);
  };

  const handleFilterClick = () => {
    if (activeButtons.includes(ButtonTypes.FILTER)) {
      setActiveButtons([]);
    } else {
      setActiveButtons([ButtonTypes.FILTER]);
      goToUserSettings(
        currentUserSettings === UserSettings.CrowdMapView
          ? UserSettings.CrowdMapView
          : UserSettings.MapView
      );
    }
    setActiveCopyLinkButton(false);
  };

  return (
    <S.MapButtonsWrapper>
      <S.MapButtons>
        <MapButton
          title={t("navbar.filter")}
          image={filterIcon}
          onClick={() => handleFilterClick()}
          alt={t("navbar.altFilter")}
          isActive={activeButtons.includes(ButtonTypes.FILTER)}
          className="active-overlay"
        />
        {isTimelapseButtonVisible && (
          <MapButton
            title={t("navbar.timelapse")}
            image={clockIcon}
            onClick={() => handleTimelapseClick()}
            alt={t("navbar.altTimelapse")}
            isActive={isTimelapseButtonActive}
            isDisabled={isTimelapseDisabled}
            className="active-overlay"
          />
        )}

        <CopyLinkComponent
          button={
            <MapButton
              title={t("navbar.copyLink")}
              image={copyLinkIcon}
              onClick={() => handleCopyLinkClick()}
              alt={t("navbar.altCopyLink")}
              isActive={activeCopyLinkButton}
              className="active-overlay"
            />
          }
          isIconOnly={false}
          showBelowButton
          onOpen={() => {
            handleCopyLinkClick();
          }}
          onClose={() => {
            setActiveCopyLinkButton(false);
          }}
        />
      </S.MapButtons>
      {showFilters && <DesktopSessionFilters />}
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
