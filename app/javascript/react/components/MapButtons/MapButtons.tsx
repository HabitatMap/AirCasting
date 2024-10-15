import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import { TRUE } from "../../const/booleans";
import { selectFixedSessionsList } from "../../store/fixedSessionsSelectors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectFiltersButtonClosed,
  selectFixedSessionsType,
  selectIsDormantSessionsType,
  setFiltersButtonClosed,
} from "../../store/sessionFiltersSlice";
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

const MapButtons: React.FC = () => {
  const { goToUserSettings, currentUserSettings, sessionType, isIndoor } =
    useMapParams();
  const [activeButtons, setActiveButtons] = useState<ButtonTypes[]>([
    ButtonTypes.FILTER,
  ]);
  const [activeCopyLinkButton, setActiveCopyLinkButton] = useState(false);

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const fixedSessionsType = useAppSelector(selectFixedSessionsType);
  const listSessions = useAppSelector((state) =>
    selectFixedSessionsList(state, fixedSessionsType)
  );
  const isDormant = useAppSelector(selectIsDormantSessionsType);

  const showFilters = activeButtons.includes(ButtonTypes.FILTER);
  const isModalView = currentUserSettings === UserSettings.ModalView;
  const isTimelapseButtonVisible =
    !isModalView && sessionType === SessionTypes.FIXED;
  const isTimelapseDisabled =
    listSessions.length === 0 || isDormant || isIndoor === TRUE;
  const isTimelapseButtonActive =
    activeButtons.includes(ButtonTypes.TIMELAPSE) &&
    currentUserSettings === UserSettings.TimelapseView;
  const filtersButtonClosed = useAppSelector(selectFiltersButtonClosed);

  const handleCopyLinkClick = () => {
    setActiveCopyLinkButton(true);
    if (activeButtons.includes(ButtonTypes.FILTER)) {
      setActiveButtons([]);
      dispatch(setFiltersButtonClosed(true));
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
      dispatch(setFiltersButtonClosed(true));
    } else {
      setActiveButtons([ButtonTypes.FILTER]);
      dispatch(setFiltersButtonClosed(false));
      if (currentUserSettings === UserSettings.CrowdMapView) {
        goToUserSettings(UserSettings.CrowdMapView);
      }
      if (currentUserSettings === UserSettings.TimelapseView) {
        goToUserSettings(UserSettings.MapView);
      }
    }
    setActiveCopyLinkButton(false);
  };

  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      setActiveButtons([ButtonTypes.TIMELAPSE]);
    } else {
      filtersButtonClosed
        ? setActiveButtons([])
        : setActiveButtons([ButtonTypes.FILTER]);
    }
  }, [currentUserSettings, filtersButtonClosed]);

  return (
    <S.MapButtonsWrapper>
      <S.MapButtons>
        <MapButton
          title={t("navbar.filter")}
          image={filterIcon}
          onClick={handleFilterClick}
          alt={t("navbar.altFilter")}
          isActive={activeButtons.includes(ButtonTypes.FILTER)}
          className="active-overlay"
        />
        {isTimelapseButtonVisible && (
          <MapButton
            title={t("navbar.timelapse")}
            image={clockIcon}
            onClick={handleTimelapseClick}
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
              onClick={handleCopyLinkClick}
              alt={t("navbar.altCopyLink")}
              isActive={activeCopyLinkButton}
              className="active-overlay"
            />
          }
          isIconOnly={false}
          showBelowButton
          onOpen={handleCopyLinkClick}
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
