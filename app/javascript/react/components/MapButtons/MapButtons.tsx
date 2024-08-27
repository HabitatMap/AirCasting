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
  const [activeButton, setActiveButton] = useState<ButtonTypes | null>(
    currentUserSettings === UserSettings.TimelapseView
      ? null
      : ButtonTypes.FILTER
  );
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();

  const listSessions = useAppSelector(selectFixedSessionsList);

  const isModalView = currentUserSettings === UserSettings.ModalView;
  const isTimelapseButtonVisible =
    !isModalView && sessionType === SessionTypes.FIXED;
  const isTimelapseDisabled = listSessions.length === 0;

  const handleClick = (buttonType: ButtonTypes) => {
    if (buttonType === ButtonTypes.TIMELAPSE) {
      if (currentUserSettings === UserSettings.TimelapseView) {
        goToUserSettings(previousUserSettings);
        setActiveButton(null);
      } else {
        goToUserSettings(UserSettings.TimelapseView);
        setActiveButton(ButtonTypes.TIMELAPSE);
      }
    } else {
      setActiveButton((prevState) =>
        prevState === buttonType ? null : buttonType
      );
    }
  };

  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      setShowFilters(false);
    } else {
      setShowFilters(activeButton === ButtonTypes.FILTER);
    }
  }, [activeButton, currentUserSettings]);

  return (
    <S.MapButtonsWrapper>
      <S.MapButtons>
        <MapButton
          title={t("navbar.filter")}
          image={filterIcon}
          onClick={() => handleClick(ButtonTypes.FILTER)}
          alt={t("navbar.altFilter")}
          isActive={activeButton === ButtonTypes.FILTER}
          className="map-button"
        />
        {isTimelapseButtonVisible && (
          <MapButton
            title={t("navbar.timelapse")}
            image={clockIcon}
            onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
            alt={t("navbar.altTimelapse")}
            isActive={
              activeButton === ButtonTypes.TIMELAPSE &&
              currentUserSettings === UserSettings.TimelapseView
            }
            isDisabled={isTimelapseDisabled}
            className="map-button"
          />
        )}

        <CopyLinkComponent
          button={
            <MapButton
              title={t("navbar.copyLink")}
              image={copyLinkIcon}
              onClick={() => {}}
              alt={t("navbar.altCopyLink")}
              isActive={activeButton === ButtonTypes.COPY_LINK}
              className="map-button"
            />
          }
          isIconOnly={false}
          showBelowButton
          onOpen={() => {
            handleClick(ButtonTypes.COPY_LINK);
          }}
          onClose={() => {
            setActiveButton(null);
          }}
        />
      </S.MapButtons>
      {showFilters && <DesktopSessionFilters />}
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
