import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TRUE } from "../../const/booleans";
import {
  selectActiveFixedSessionsState,
  selectDormantFixedSessionsState,
} from "../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../store/hooks";
import { selectIndoorSessionsState } from "../../store/indoorSessionsSelectors";
import { selectMobileSessionsState } from "../../store/mobileSessionsSelectors";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicParametersModalOpen,
  selectBasicSensorsModalOpen,
  selectCustomParametersModalOpen,
  selectCustomSensorsModalOpen,
  selectFixedSessionsType,
  selectIsDormantSessionsType,
} from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
import { SensorPrefix } from "../../types/sensors";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CloseButton } from "../Map/Legend/Legend.style";
import { CrowdMapToggle } from "./CrowdmapToggle";
import { CustomParameterFilter } from "./CustomParameterFilter";
import { CustomSensorFilter } from "./CustomSensorFilter";
import { DormantToggle } from "./DormantToggle";
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

interface MobileSessionFiltersProps {
  onClose: () => void;
  fetchableSessionsCount: number;
}

const MobileSessionFilters = ({
  onClose,
  fetchableSessionsCount,
}: MobileSessionFiltersProps) => {
  const indoorSessionsState = useAppSelector(selectIndoorSessionsState);

  const dormantFixedSessionsState = useAppSelector(
    selectDormantFixedSessionsState
  );
  const activeFixedSessionsState = useAppSelector(
    selectActiveFixedSessionsState
  );
  const fixedSessionsType = useAppSelector(selectFixedSessionsType);
  const mobileSessionsState = useAppSelector(selectMobileSessionsState);
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
    basicParametersModalOpen
  );
  const [isCustomSensorsModalOpen, setIsCustomSensorsModalOpen] = useState(
    customParametersModalOpen
  );
  const { sessionType, measurementType, isIndoor, sensorName } = useMapParams();
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

  const sessionsCount = useMemo(() => {
    switch (sessionType) {
      case SessionTypes.FIXED:
        return isIndoorParameterInUrl
          ? indoorSessionsState.sessions.length
          : isDormant
          ? dormantFixedSessionsState.length
          : activeFixedSessionsState.length;

      case SessionTypes.MOBILE:
        return mobileSessionsState.sessions.length;
    }
  }, [
    mobileSessionsState,
    sessionType,
    indoorSessionsState,
    dormantFixedSessionsState,
    activeFixedSessionsState,
    mobileSessionsState,
    sessionType,
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
