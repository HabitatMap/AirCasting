import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TRUE } from "../../const/booleans";
import { useAppSelector } from "../../store/hooks";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicParametersModalOpen,
  selectBasicSensorsModalOpen,
  selectCustomParametersModalOpen,
  selectCustomSensorsModalOpen,
  selectIsDormantSessionsType,
} from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
import { SensorPrefix } from "../../types/sensors";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CloseButton } from "../Map/Legend/Legend.style";
import { CrowdMapToggle } from "./CrowdmapToggle";
import { CustomParameterFilter } from "./CustomParameterFilter";
import { CustomSensorFilter } from "./CustomSensorFilter";
import { IndoorOutdoorSwitch } from "./IndoorOutdoorSwitch";
import {
  filterCustomParameters,
  MobileDeviceParameterFilter,
  ParameterFilter,
} from "./ParameterFilter";
import { ProfileNamesInput } from "./ProfileNamesInput";
import {
  filterCustomSensors,
  MobileDeviceSensorFilter,
  SensorFilter,
} from "./SensorFilter";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";
import { TagsInput } from "./TagsInput";
import { YearPicker } from "./YearPicker";

import { useIndoorSessions } from "../../store/indoorSessionsSlice";
// import { useMobileSessions } from "../../store/mobileSessionsSlice";
import { FixedSessionsTypes } from "../../store/sessionFiltersSlice";
import { DormantToggle } from "./DormantToggle";

interface MobileSessionFiltersProps {
  onClose: () => void;
  fetchableSessionsCount: number;
}

const MobileSessionFilters = ({
  onClose,
  fetchableSessionsCount,
}: MobileSessionFiltersProps) => {
  const basicParametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );
  const customParametersModalOpen = useAppSelector(
    selectCustomParametersModalOpen
  );
  const [isBasicParametersModalOpen, setIsBasicParametersModalOpen] = useState(
    basicParametersModalOpen
  );
  const [isCustomParametersModalOpen, setIsCustomParametersModalOpen] =
    useState(customParametersModalOpen);
  const basicSensorsModalOpen = useAppSelector(selectBasicSensorsModalOpen);
  const customSensorsModalOpen = useAppSelector(selectCustomSensorsModalOpen);
  const [isBasicSensorsModalOpen, setIsBasicSensorsModalOpen] = useState(
    basicSensorsModalOpen
  );
  const [isCustomSensorsModalOpen, setIsCustomSensorsModalOpen] = useState(
    customSensorsModalOpen
  );
  const {
    sessionType,
    measurementType,
    isIndoor,
    sensorName,
    timeFrom,
    timeTo,
    tags,
    usernames,
    unitSymbol,
  } = useMapParams();
  const { t } = useTranslation();

  const parameters = useAppSelector(selectParameters);
  const customParameters = filterCustomParameters(parameters, sessionType);

  const sensors = useAppSelector(selectSensors);
  const customSensors = filterCustomSensors(
    sensors,
    measurementType,
    sessionType
  );

  const isIndoorParameterInUrl = isIndoor === TRUE;
  const airBeamSensorNameSelected = sensorName.startsWith(SensorPrefix.AIR);
  const govermentSensorNameSelected = sensorName.startsWith(
    SensorPrefix.GOVERNMENT
  );
  const isFixedSessionTypeSelected: boolean =
    sessionType === SessionTypes.FIXED;
  const isDormant = useAppSelector(selectIsDormantSessionsType);

  // Define filters
  const filters = useMemo(() => {
    const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
    const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);
    const sensorNamedDecoded = decodeURIComponent(sensorName);
    const tagsDecoded = tags && decodeURIComponent(tags);
    const usernamesDecoded = usernames && decodeURIComponent(usernames);

    return JSON.stringify({
      time_from: timeFrom,
      time_to: timeTo,
      tags: tagsDecoded,
      usernames: usernamesDecoded,
      sensor_name: sensorNamedDecoded.toLowerCase(),
      measurement_type: measurementType,
      unit_symbol: encodedUnitSymbol,
      is_indoor: isIndoorParameterInUrl,
    });
  }, [
    sensorName,
    measurementType,
    isIndoorParameterInUrl,
    timeFrom,
    timeTo,
    tags,
    usernames,
    unitSymbol,
  ]);

  // Define indoor sessions filters
  const indoorSessionsFilters = useMemo(() => {
    const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
    const encodedUnitSymbol = encodeURIComponent(preparedUnitSymbol);
    const sensorNamedDecoded = decodeURIComponent(sensorName);
    const tagsDecoded = tags && decodeURIComponent(tags);
    const usernamesDecoded = usernames && decodeURIComponent(usernames);

    return JSON.stringify({
      time_from: timeFrom,
      time_to: timeTo,
      tags: tagsDecoded,
      usernames: usernamesDecoded,
      sensor_name: sensorNamedDecoded.toLowerCase(),
      measurement_type: measurementType,
      unit_symbol: encodedUnitSymbol,
      is_indoor: true, // explicitly set to true
    });
  }, [
    sensorName,
    measurementType,
    timeFrom,
    timeTo,
    tags,
    usernames,
    unitSymbol,
  ]);

  // Fetch fixed sessions using react-query hooks
  // const {
  //   data: activeSessionsData,
  //   isLoading: activeSessionsLoading,
  //   error: activeSessionsError,
  // } = useFixedSessions(FixedSessionsTypes.ACTIVE, filters);

  // const {
  //   data: dormantSessionsData,
  //   isLoading: dormantSessionsLoading,
  //   error: dormantSessionsError,
  // } = useFixedSessions(FixedSessionsTypes.DORMANT, filters);

  // Fetch indoor sessions using react-query hooks
  const {
    data: activeIndoorSessionsData,
    isLoading: activeIndoorSessionsLoading,
    error: activeIndoorSessionsError,
  } = useIndoorSessions(FixedSessionsTypes.ACTIVE, indoorSessionsFilters);

  const {
    data: dormantIndoorSessionsData,
    isLoading: dormantIndoorSessionsLoading,
    error: dormantIndoorSessionsError,
  } = useIndoorSessions(FixedSessionsTypes.DORMANT, indoorSessionsFilters);

  // // Fetch mobile sessions using react-query hooks
  // const {
  //   data: mobileSessionsData,
  //   isLoading: mobileSessionsLoading,
  //   error: mobileSessionsError,
  // } = useMobileSessions(filters);

  const sessionsCount = useMemo(() => {
    switch (sessionType) {
      case SessionTypes.FIXED:
        if (isIndoorParameterInUrl) {
          const indoorSessionsData = isDormant
            ? dormantIndoorSessionsData
            : activeIndoorSessionsData;
          return indoorSessionsData?.sessions.length || 0;
        } else {
          const fixedSessionsData = isDormant
            ? dormantSessionsData
            : activeSessionsData;
          return fixedSessionsData?.sessions.length || 0;
        }
      // case SessionTypes.MOBILE:
      //   return mobileSessionsData?.sessions.length || 0;
      default:
        return 0;
    }
  }, [
    sessionType,
    isIndoorParameterInUrl,
    isDormant,
    activeIndoorSessionsData,
    dormantIndoorSessionsData,
    activeSessionsData,
    dormantSessionsData,
    // mobileSessionsData,
  ]);

  useEffect(() => {
    setIsBasicParametersModalOpen(basicParametersModalOpen);
    setIsCustomParametersModalOpen(customParametersModalOpen);
    setIsBasicSensorsModalOpen(basicSensorsModalOpen);
    setIsCustomSensorsModalOpen(customSensorsModalOpen);
  }, [
    basicParametersModalOpen,
    customParametersModalOpen,
    basicSensorsModalOpen,
    customSensorsModalOpen,
  ]);

  return (
    <S.MobileSessionFilters>
      {isBasicParametersModalOpen ? (
        <MobileDeviceParameterFilter
          customParameters={customParameters}
          sessionsCount={sessionsCount}
          onClose={onClose}
          fetchableSessionsCount={fetchableSessionsCount}
        />
      ) : isCustomParametersModalOpen ? (
        <CustomParameterFilter
          customParameters={customParameters}
          sessionsCount={sessionsCount}
          onClose={onClose}
          fetchableSessionsCount={fetchableSessionsCount}
        />
      ) : isBasicSensorsModalOpen ? (
        <MobileDeviceSensorFilter
          customSensors={customSensors}
          sessionsCount={sessionsCount}
          onClose={onClose}
          fetchableSessionsCount={fetchableSessionsCount}
        />
      ) : isCustomSensorsModalOpen ? (
        <CustomSensorFilter
          customSensors={customSensors}
          sessionsCount={sessionsCount}
          onClose={onClose}
          fetchableSessionsCount={fetchableSessionsCount}
        />
      ) : (
        <>
          <S.ModalContent>
            <S.Header>
              <CloseButton onClick={onClose}></CloseButton>
              <S.HeaderTitle>{t("filters.editFilters")}</S.HeaderTitle>
            </S.Header>
            <SessionTypeToggle />
            <ParameterFilter isBasicOpen={isBasicParametersModalOpen} />
            <SensorFilter isBasicOpen={isBasicSensorsModalOpen} />
            {!govermentSensorNameSelected && (
              <>
                <ProfileNamesInput />
                <TagsInput />
              </>
            )}
            {isFixedSessionTypeSelected && airBeamSensorNameSelected && (
              <IndoorOutdoorSwitch />
            )}
            {isFixedSessionTypeSelected && <DormantToggle />}
            {!isFixedSessionTypeSelected && <YearPicker />}
            {!isFixedSessionTypeSelected && <CrowdMapToggle />}
          </S.ModalContent>
          <S.ShowSessionsButton onClick={onClose}>
            {isFixedSessionTypeSelected ? (
              <>
                {t("filters.showSessions")} ({sessionsCount})
              </>
            ) : (
              <>
                {t("filters.showSessions")}{" "}
                {t("map.results", {
                  results: sessionsCount,
                  fetchableSessionsCount,
                })}
              </>
            )}
          </S.ShowSessionsButton>
        </>
      )}
    </S.MobileSessionFilters>
  );
};

export { MobileSessionFilters };
