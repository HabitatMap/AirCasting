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
  const [activeButtons, setActiveButtons] = useState<ButtonTypes[]>([
    ButtonTypes.FILTER,
  ]);
  const [showFilters, setShowFilters] = useState(true);
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
        setActiveButtons([ButtonTypes.FILTER]);
      } else {
        goToUserSettings(UserSettings.TimelapseView);
        setActiveButtons([ButtonTypes.TIMELAPSE]);
      }
    } else if (buttonType === ButtonTypes.COPY_LINK) {
      setActiveButtons((prevState) => {
        if (prevState.includes(ButtonTypes.TIMELAPSE)) {
          return prevState.includes(ButtonTypes.COPY_LINK)
            ? prevState
            : [...prevState, ButtonTypes.COPY_LINK];
        } else {
          return prevState.includes(ButtonTypes.COPY_LINK)
            ? prevState.filter((type) => type !== ButtonTypes.COPY_LINK)
            : [ButtonTypes.COPY_LINK];
        }
      });
    } else if (buttonType === ButtonTypes.FILTER) {
      if (currentUserSettings === UserSettings.TimelapseView) {
        goToUserSettings(previousUserSettings);
      }
      setActiveButtons([ButtonTypes.FILTER]);
    }
  };

  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      setShowFilters(false);
    } else {
      setShowFilters(activeButtons.includes(ButtonTypes.FILTER));
    }
  }, [activeButtons, currentUserSettings]);

  return (
    <S.MapButtonsWrapper>
      <S.MapButtons>
        <MapButton
          title={t("navbar.filter")}
          image={filterIcon}
          onClick={() => handleClick(ButtonTypes.FILTER)}
          alt={t("navbar.altFilter")}
          isActive={activeButtons.includes(ButtonTypes.FILTER)}
          className="active-overlay"
        />
        {isTimelapseButtonVisible && (
          <MapButton
            title={t("navbar.timelapse")}
            image={clockIcon}
            onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
            alt={t("navbar.altTimelapse")}
            isActive={activeButtons.includes(ButtonTypes.TIMELAPSE)}
            isDisabled={isTimelapseDisabled}
            className="active-overlay"
          />
        )}

        <CopyLinkComponent
          button={
            <MapButton
              title={t("navbar.copyLink")}
              image={copyLinkIcon}
              onClick={() => {}}
              alt={t("navbar.altCopyLink")}
              isActive={activeButtons.includes(ButtonTypes.COPY_LINK)}
              className="active-overlay"
            />
          }
          isIconOnly={false}
          showBelowButton
          onOpen={() => {
            handleClick(ButtonTypes.COPY_LINK);
          }}
          onClose={() => {
            setActiveButtons((prevState) =>
              prevState.filter((type) => type !== ButtonTypes.COPY_LINK)
            );
          }}
        />
      </S.MapButtons>
      {showFilters && <DesktopSessionFilters />}
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
