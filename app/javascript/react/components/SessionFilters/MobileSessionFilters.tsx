import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { selectFixedSessionsState } from "../../store/fixedSessionsSelectors";
import { useAppSelector } from "../../store/hooks";
import { selectIndoorSessionsState } from "../../store/indoorSessionsSelectors";
import { selectMobileSessionsState } from "../../store/mobileSessionsSelectors";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicParametersModalOpen,
  selectBasicSensorsModalOpen,
  selectCustomParametersModalOpen,
  selectCustomSensorsModalOpen,
} from "../../store/sessionFiltersSlice";
import { SessionTypes } from "../../types/filters";
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

interface MobileSessionFiltersProps {
  onClose: () => void;
}

const MobileSessionFilters = ({ onClose }: MobileSessionFiltersProps) => {
  const fixedSessionsState = useAppSelector(selectFixedSessionsState);
  const indoorSessionsState = useAppSelector(selectIndoorSessionsState);

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

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const isIndoorParameterInUrl = isIndoor === "true";
  const airBeamSensorNameSelected = sensorName.startsWith("Air");

  const sessionsCount = useMemo(() => {
    switch (sessionType) {
      case SessionTypes.FIXED:
        return isIndoorParameterInUrl
          ? indoorSessionsState.sessions.length
          : fixedSessionsState.sessions.length;
      case SessionTypes.MOBILE:
        return mobileSessionsState.sessions.length;
    }
  }, [
    fixedSessionsState,
    mobileSessionsState,
    sessionType,
    indoorSessionsState,
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
        />
      ) : isCustomParametersModalOpen ? (
        <CustomParameterFilter
          customParameters={customParameters}
          sessionsCount={sessionsCount}
          onClose={onClose}
        />
      ) : isBasicSensorsModalOpen ? (
        <MobileDeviceSensorFilter
          customSensors={customSensors}
          sessionsCount={sessionsCount}
          onClose={onClose}
        />
      ) : isCustomSensorsModalOpen ? (
        <CustomSensorFilter
          customSensors={customSensors}
          sessionsCount={sessionsCount}
          onClose={onClose}
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
            <ProfileNamesInput />
            <TagsInput />
            {fixedSessionTypeSelected && airBeamSensorNameSelected && (
              <IndoorOutdoorSwitch />
            )}
            {!fixedSessionTypeSelected && <CrowdMapToggle />}
          </S.ModalContent>
          <S.ShowSessionsButton onClick={onClose}>
            {t("filters.showSessions")} ({sessionsCount})
          </S.ShowSessionsButton>
        </>
      )}
    </S.MobileSessionFilters>
  );
};

export { MobileSessionFilters };
