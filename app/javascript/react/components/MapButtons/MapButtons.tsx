import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import clockIcon from "../../assets/icons/clockIcon.svg";
import copyLinkIcon from "../../assets/icons/copyLinkIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import { SessionTypes } from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CopyLinkComponent } from "../Popups/CopyLinkComponent";
import { DesktopSessionFilters } from "../SessionFilters/DesktopSessionFilters";
import { MapButton } from "./MapButton";
import * as S from "./MapButtons.style";

import { TRUE } from "../../const/booleans";

import { useFixedSessions } from "../../hooks/useFixedSessions";
import { FixedSessionsTypes } from "../../store/sessionFiltersSlice";

enum ButtonTypes {
  FILTER = "filter",
  TIMELAPSE = "timelapse",
  COPY_LINK = "copyLink",
  SHARE = "share",
}

const MapButtons: React.FC = () => {
  const {
    goToUserSettings,
    currentUserSettings,
    sessionType,
    isIndoor,
    isActive,
    timeFrom,
    timeTo,
    tags,
    usernames,
    sensorName,
    measurementType,
    unitSymbol,
    boundWest,
    boundEast,
    boundSouth,
    boundNorth,
  } = useMapParams();
  const [activeButtons, setActiveButtons] = useState<ButtonTypes[]>([]);
  const [activeCopyLinkButton, setActiveCopyLinkButton] = useState(false);

  const { t } = useTranslation();

  const isDormant = !isActive;

  // Prepare filter parameters
  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);
  const sensorNamedDecoded = decodeURIComponent(sensorName);
  const tagsDecoded = tags && decodeURIComponent(tags);
  const usernamesDecoded = usernames && decodeURIComponent(usernames);

  // Define filters using useMemo to avoid unnecessary recomputations
  const filters = useMemo(() => {
    return JSON.stringify({
      time_from: timeFrom,
      time_to: timeTo,
      tags: tagsDecoded,
      usernames: usernamesDecoded,
      west: boundWest,
      east: boundEast,
      south: boundSouth,
      north: boundNorth,
      sensor_name: sensorNamedDecoded.toLowerCase(),
      measurement_type: measurementType,
      unit_symbol: encodedUnitSymbol,
      is_indoor: isIndoor === TRUE,
    });
  }, [
    timeFrom,
    timeTo,
    tagsDecoded,
    usernamesDecoded,
    boundWest,
    boundEast,
    boundSouth,
    boundNorth,
    sensorNamedDecoded,
    measurementType,
    encodedUnitSymbol,
    isIndoor,
  ]);

  // Fetch fixed sessions data using react-query hooks
  const {
    data: activeSessionsData,
    isLoading: activeSessionsLoading,
    error: activeSessionsError,
  } = useFixedSessions(FixedSessionsTypes.ACTIVE, {
    filters,
    enabled: false,
  });

  const {
    data: dormantSessionsData,
    isLoading: dormantSessionsLoading,
    error: dormantSessionsError,
  } = useFixedSessions(FixedSessionsTypes.DORMANT, {
    filters,
    enabled: false,
  });

  // Determine which sessions data to use based on isActive
  const fixedSessionsData = isActive ? activeSessionsData : dormantSessionsData;
  const listSessions = fixedSessionsData?.sessions || [];

  const showFilters = activeButtons.includes(ButtonTypes.FILTER);
  const isModalView = currentUserSettings === UserSettings.ModalView;
  const isTimelapseButtonVisible =
    !isModalView && sessionType === SessionTypes.FIXED;
  const isTimelapseDisabled =
    listSessions.length === 0 || isDormant || isIndoor === TRUE;
  const isTimelapseButtonActive =
    activeButtons.includes(ButtonTypes.TIMELAPSE) &&
    currentUserSettings === UserSettings.TimelapseView;

  useEffect(() => {
    if (currentUserSettings === UserSettings.TimelapseView) {
      setActiveButtons([ButtonTypes.TIMELAPSE]);
    } else {
      setActiveButtons([ButtonTypes.FILTER]);
    }
  }, [currentUserSettings]);

  const handleCopyLinkClick = () => {
    setActiveCopyLinkButton(true);
    if (activeButtons.includes(ButtonTypes.FILTER)) {
      setActiveButtons([]);
    }
  };

  const handleTimelapseClick = () => {
    if (activeButtons.includes(ButtonTypes.TIMELAPSE)) {
      setActiveButtons([ButtonTypes.FILTER]);
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
