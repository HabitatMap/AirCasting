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
    setActiveButtons((prevState) => {
      if (buttonType === ButtonTypes.TIMELAPSE) {
        if (prevState.includes(ButtonTypes.TIMELAPSE)) {
          goToUserSettings(previousUserSettings);
          return prevState.filter((type) => type !== ButtonTypes.TIMELAPSE);
        } else {
          goToUserSettings(UserSettings.TimelapseView);
          return [ButtonTypes.TIMELAPSE];
        }
      } else if (buttonType === ButtonTypes.COPY_LINK) {
        return prevState.includes(ButtonTypes.COPY_LINK)
          ? prevState.filter((type) => type !== ButtonTypes.COPY_LINK)
          : [...prevState, ButtonTypes.COPY_LINK];
      } else if (buttonType === ButtonTypes.FILTER) {
        // Close timelapse and make filter button active
        goToUserSettings(previousUserSettings);
        return [ButtonTypes.FILTER];
      } else if (prevState.includes(buttonType)) {
        return prevState.filter((type) => type !== buttonType);
      } else {
        if (prevState.includes(ButtonTypes.TIMELAPSE)) {
          return [ButtonTypes.TIMELAPSE, buttonType].filter(
            (type) => type !== ButtonTypes.FILTER
          );
        }
        return [...prevState, buttonType];
      }
    });
  };
  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      setShowFilters(false);
      if (!activeButtons.includes(ButtonTypes.TIMELAPSE)) {
        setActiveButtons([ButtonTypes.TIMELAPSE]);
      }
    } else {
      setShowFilters(activeButtons.includes(ButtonTypes.FILTER));
      if (activeButtons.includes(ButtonTypes.TIMELAPSE)) {
        setActiveButtons((prevState) =>
          prevState.filter((type) => type !== ButtonTypes.TIMELAPSE)
        );
      }
    }
  }, [currentUserSettings]);

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
              onClick={() => handleClick(ButtonTypes.COPY_LINK)}
              alt={t("navbar.altCopyLink")}
              isActive={activeButtons.includes(ButtonTypes.COPY_LINK)}
              className="active-overlay"
            />
          }
          isIconOnly={false}
          showBelowButton
          onOpen={() => {
            if (!activeButtons.includes(ButtonTypes.COPY_LINK)) {
              handleClick(ButtonTypes.COPY_LINK);
            }
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
