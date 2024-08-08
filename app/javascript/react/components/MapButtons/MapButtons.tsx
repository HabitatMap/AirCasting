import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import shareIcon from "../../assets/icons/shareIcon.svg";
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
  const [activeButton, setActiveButton] = useState<ButtonTypes | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();
  const { goToUserSettings, currentUserSettings, previousUserSettings } =
    useMapParams();

  const isModalView = currentUserSettings === UserSettings.ModalView;

  const handleClick = (buttonType: ButtonTypes) => {
    setActiveButton((prevState) =>
      prevState === buttonType ? null : buttonType
    );

    if (buttonType === ButtonTypes.TIMELAPSE) {
      goToUserSettings(UserSettings.TimelapseView);
      if (currentUserSettings === UserSettings.TimelapseView) {
        goToUserSettings(previousUserSettings);
        setActiveButton(null);
      }
    }
  };

  useEffect(() => {
    setShowFilters(activeButton === ButtonTypes.FILTER);
  }, [activeButton]);

  return (
    <S.MapButtonsWrapper>
      <S.MapButtons>
        <MapButton
          title={t("navbar.filter")}
          image={filterIcon}
          onClick={() => handleClick(ButtonTypes.FILTER)}
          alt={t("navbar.altFilter")}
          isActive={activeButton === ButtonTypes.FILTER}
        />
        {!isModalView && (
          <MapButton
            title={t("navbar.timelapse")}
            image={clockIcon}
            onClick={() => handleClick(ButtonTypes.TIMELAPSE)}
            alt={t("navbar.altTimelapse")}
            isActive={activeButton === ButtonTypes.TIMELAPSE}
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
        <MapButton
          title={t("navbar.share")}
          image={shareIcon}
          onClick={() => handleClick(ButtonTypes.SHARE)}
          alt={t("navbar.altShare")}
          isActive={activeButton === ButtonTypes.SHARE}
        />
      </S.MapButtons>
      {showFilters && <DesktopSessionFilters />}
    </S.MapButtonsWrapper>
  );
};

export { MapButtons };
