import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevron from "../../assets/icons/chevronRight.svg";
import { useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { setBasicPrametersModalOpen } from "../../store/sessionFiltersSlice";
import {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
  SessionTypes,
} from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

export enum unitSymbolTypes {
  PARTICULATE_MATTER = "µg/m³",
  HUMIDITY = "%",
  NITROGEN_DIOXIDE = "ppb",
  OZONE = "ppb",
  TEMPERATURE = "F",
  SOUND_LEVEL = "dB",
}

// TEMPORARY SOLUTION, WILL BE IMPLEMENTED IN NEXT PR
const setDefaultSensor = (
  selectedParameter: ParameterType,
  sessionType: SessionType
) => {
  if (sessionType === SessionTypes.FIXED) {
    switch (selectedParameter) {
      case FixedBasicParameterTypes.PARTICULATE_MATTER:
        return {
          sensorName: "Government-PM2.5",
          unitSymbol: unitSymbolTypes.PARTICULATE_MATTER,
        };
      case FixedBasicParameterTypes.HUMIDITY:
        return {
          sensorName: "AirBeam-RH",
          unitSymbol: unitSymbolTypes.HUMIDITY,
        };
      case FixedBasicParameterTypes.NITROGEN_DIOXIDE:
        return {
          sensorName: "Government-NO2",
          unitSymbol: unitSymbolTypes.NITROGEN_DIOXIDE,
        };
      case FixedBasicParameterTypes.OZONE:
        return {
          sensorName: "Government-Ozone",
          unitSymbol: unitSymbolTypes.OZONE,
        };
      case FixedBasicParameterTypes.TEMPERATURE:
        return {
          sensorName: "AirBeam-F",
          unitSymbol: unitSymbolTypes.TEMPERATURE,
        };
      default:
        return {
          sensorName: "Government-PM2.5",
          unitSymbol: unitSymbolTypes.PARTICULATE_MATTER,
        };
    }
  } else {
    switch (selectedParameter) {
      case MobileBasicParameterTypes.PARTICULATE_MATTER:
        return {
          sensorName: "AirBeam-PM2.5",
          unitSymbol: unitSymbolTypes.PARTICULATE_MATTER,
        };
      case MobileBasicParameterTypes.HUMIDITY:
        return {
          sensorName: "AirBeam-RH",
          unitSymbol: unitSymbolTypes.HUMIDITY,
        };
      case MobileBasicParameterTypes.SOUND_LEVEL:
        return {
          sensorName: "Phone microphone",
          unitSymbol: unitSymbolTypes.SOUND_LEVEL,
        };
      case MobileBasicParameterTypes.TEMPERATURE:
        return {
          sensorName: "AirBeam-F",
          unitSymbol: unitSymbolTypes.TEMPERATURE,
        };
      default:
        return {
          sensorName: "AirBeam-PM2.5",
          unitSymbol: unitSymbolTypes.PARTICULATE_MATTER,
        };
    }
  }
};

const basicMeasurementTypes = (sessionType: SessionType) =>
  sessionType === SessionTypes.FIXED
    ? Object.values(FixedBasicParameterTypes)
    : Object.values(MobileBasicParameterTypes);

const ParameterFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { measurementType, setUrlParams, sessionType, currentUserSettings } =
    useMapParams();
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();

  const handleShowParametersClick = () => {
    isMobile ? dispatch(setBasicPrametersModalOpen(true)) : setIsOpen(!isOpen);
  };

  const handleSelectParameter = (selectedParameter: ParameterType) => {
    dispatch(setLoading(true));
    setUrlParams([
      {
        key: UrlParamsTypes.previousUserSettings,
        value: currentUserSettings,
      },
      {
        key: UrlParamsTypes.currentUserSettings,
        value: isMobile
          ? UserSettings.FiltersView
          : currentUserSettings === UserSettings.CrowdMapView
          ? UserSettings.CrowdMapView
          : UserSettings.MapView,
      },
      {
        key: UrlParamsTypes.measurementType,
        value: selectedParameter,
      },
      {
        key: UrlParamsTypes.sensorName,
        value: setDefaultSensor(selectedParameter, sessionType).sensorName,
      },
      {
        key: UrlParamsTypes.unitSymbol,
        value: setDefaultSensor(selectedParameter, sessionType).unitSymbol,
      },
    ]);
    setIsOpen(false);
  };

  return (
    <>
      <S.Wrapper>
        <S.SingleFilterWrapper>
          <S.SelectedOptionButton
            onClick={handleShowParametersClick}
            $isActive={isOpen}
          >
            <S.SelectedOptionHeadingWrapper>
              <S.SelectedOptionHeading $isSelected={isOpen}>
                {t("filters.parameter")}
              </S.SelectedOptionHeading>
              <S.SelectedOption $isSelected={isOpen}>
                {measurementType}
              </S.SelectedOption>
            </S.SelectedOptionHeadingWrapper>
            <S.ChevronIcon $src={chevron} $isActive={isOpen} />
          </S.SelectedOptionButton>
          <FilterInfoPopup filterTranslationLabel="filters.parameterInfo" />
        </S.SingleFilterWrapper>
        {!isMobile && isOpen && (
          <S.FiltersOptionsWrapper>
            <S.BasicParameterWrapper>
              <S.FiltersOptionHeading>
                {t("filters.parameter")}
              </S.FiltersOptionHeading>
              {basicMeasurementTypes(sessionType).map((item, id) => (
                <S.FiltersOptonButton
                  $isSelected={item === measurementType}
                  key={id}
                  onClick={() => handleSelectParameter(item)}
                >
                  {item}
                </S.FiltersOptonButton>
              ))}
            </S.BasicParameterWrapper>
          </S.FiltersOptionsWrapper>
        )}
      </S.Wrapper>
    </>
  );
};

export { ParameterFilter };

interface MobileDeviceParameterFilterProps {
  sessionsCount: number | undefined;
  onClose: () => void;
}

const MobileDeviceParameterFilter = ({
  sessionsCount,
  onClose,
}: MobileDeviceParameterFilterProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { measurementType, setUrlParams, sessionType } = useMapParams();

  const handleSelectParameter = (selectedParameter: ParameterType) => {
    dispatch(setLoading(true));
    setUrlParams([
      {
        key: UrlParamsTypes.measurementType,
        value: selectedParameter,
      },
      {
        key: UrlParamsTypes.sensorName,
        value: setDefaultSensor(selectedParameter, sessionType).sensorName,
      },
      {
        key: UrlParamsTypes.unitSymbol,
        value: setDefaultSensor(selectedParameter, sessionType).unitSymbol,
      },
    ]);
  };

  return (
    <>
      <S.ModalContent>
        <S.Header>
          <S.ChevronBackButton
            onClick={() => dispatch(setBasicPrametersModalOpen(false))}
          >
            <S.ChevronIcon $src={chevronLeft} />
          </S.ChevronBackButton>
          <S.HeaderTitle>{t("filters.selectParameter")}</S.HeaderTitle>
        </S.Header>
        <S.Description>{t("filters.selectParameterDescription")}</S.Description>
        <S.BasicParameterButtonsWrapper>
          {basicMeasurementTypes(sessionType).map((item, id) => (
            <S.BasicParameterButton
              key={id}
              onClick={() => handleSelectParameter(item)}
            >
              <S.ButtonSpan $isActive={item === measurementType}>
                {item}
              </S.ButtonSpan>
              {item === measurementType && <img src={checkmark} />}
            </S.BasicParameterButton>
          ))}
        </S.BasicParameterButtonsWrapper>
      </S.ModalContent>
      <S.ButtonsWrapper>
        <S.BackButton
          onClick={() => dispatch(setBasicPrametersModalOpen(false))}
        >
          {t("filters.back")}
        </S.BackButton>
        <S.MinorShowSessionsButton onClick={onClose}>
          {t("filters.showSessions")} ({sessionsCount})
        </S.MinorShowSessionsButton>
      </S.ButtonsWrapper>
    </>
  );
};

export { MobileDeviceParameterFilter };
