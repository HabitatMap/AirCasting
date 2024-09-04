import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevron from "../../assets/icons/chevronRight.svg";
import minus from "../../assets/icons/minus.svg";
import plus from "../../assets/icons/plus.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicSensorsModalOpen,
  selectCustomSensorsModalOpen,
  setBasicParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomSensorsModalOpen,
} from "../../store/sessionFiltersSlice";
import { ParameterTypes, SessionType, SessionTypes } from "../../types/filters";
import { BasicSensorTypes, Sensor } from "../../types/sensors";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { CustomSensorFilter } from "./CustomSensorFilter";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

export const getBasicSensors = (
  measurementType: string,
  sessionType: string
) => {
  if (measurementType !== ParameterTypes.PARTICULATE_MATTER) {
    for (const [key, value] of Object.entries(ParameterTypes) as Array<
      [keyof typeof ParameterTypes, string]
    >) {
      if (value === measurementType) {
        return BasicSensorTypes[key].toString().split(",");
      }
    }
  } else {
    if (sessionType === SessionTypes.FIXED) {
      return BasicSensorTypes.PARTICULATE_MATTER.FIXED.toString().split(",");
    } else if (sessionType === SessionTypes.MOBILE) {
      return BasicSensorTypes.PARTICULATE_MATTER.MOBILE.toString().split(",");
    }
  }
};

export const getSensorUnitSymbol = (
  selectedSensor: string,
  sensors: Sensor[]
): string => {
  const sensor = sensors.find((el) => el.sensorName === selectedSensor);
  return sensor?.unitSymbol || "";
};

export const filterCustomSensors = (
  sensors: Sensor[],
  measurementType: string,
  sessionType: SessionType
): string[] => {
  const sensorsForMeasurementType = sensors.filter(
    (sensor) => sensor.measurementType === measurementType
  );
  const basicSensors = getBasicSensors(measurementType, sessionType);
  return sensorsForMeasurementType
    .filter((sensor) => !basicSensors?.includes(sensor.sensorName))
    .map((sensor) => sensor.sensorName);
};

const setSensorParams = (
  selectedSensor: string,
  sensors: Sensor[],
  isMobile: boolean,
  currentUserSettings: UserSettings,
  isIndoor: string | null,
  setUrlParams: (params: { key: UrlParamsTypes; value: string }[]) => void,
  dispatch: (action: any) => void
) => {
  const commonParams = [
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
      key: UrlParamsTypes.sensorName,
      value: selectedSensor,
    },
    {
      key: UrlParamsTypes.unitSymbol,
      value: getSensorUnitSymbol(selectedSensor, sensors),
    },
    {
      key: UrlParamsTypes.currentZoom,
      value: UrlParamsTypes.previousZoom,
    },
  ];

  setUrlParams(commonParams);

  if (isIndoor === "true" && selectedSensor.startsWith("Gov")) {
    setUrlParams([
      ...commonParams,
      {
        key: UrlParamsTypes.isIndoor,
        value: "false",
      },
    ]);
  }

  dispatch(setBasicSensorsModalOpen(false));
  dispatch(setFetchingData(true));
};

export const SensorFilter: React.FC<{ isBasicOpen: boolean }> = ({
  isBasicOpen,
}) => {
  const { t } = useTranslation();
  const { sensorName } = useMapParams();
  const dispatch = useAppDispatch();
  const basicSensorsModalOpen = useAppSelector(selectBasicSensorsModalOpen);

  const handleShowSensorClick = () => {
    dispatch(setBasicSensorsModalOpen(!basicSensorsModalOpen));
    dispatch(setBasicParametersModalOpen(false));
  };

  return (
    <S.SingleFilterWrapper>
      <S.SelectedOptionButton
        onClick={handleShowSensorClick}
        $isActive={isBasicOpen}
      >
        <S.SelectedOptionHeadingWrapper>
          <S.SelectedOptionHeading $isSelected={isBasicOpen}>
            {t("filters.sensor")}
          </S.SelectedOptionHeading>
          <S.SelectedOption $isSelected={isBasicOpen}>
            {sensorName}
          </S.SelectedOption>
        </S.SelectedOptionHeadingWrapper>
        <S.ChevronIcon $src={chevron} $isActive={isBasicOpen} />
      </S.SelectedOptionButton>
      <FilterInfoPopup filterTranslationLabel="filters.sensorInfo" />
    </S.SingleFilterWrapper>
  );
};

export const DesktopSensorFilter = () => {
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useTranslation();
  const {
    measurementType,
    setUrlParams,
    sessionType,
    currentUserSettings,
    sensorName,
    isIndoor,
  } = useMapParams();
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const sensors = useAppSelector(selectSensors);
  const basicSensorsModalOpen = useAppSelector(selectBasicSensorsModalOpen);
  const customSensorsModalOpen = useAppSelector(selectCustomSensorsModalOpen);

  const customSensors = filterCustomSensors(
    sensors,
    measurementType,
    sessionType
  );
  const basicSensors = getBasicSensors(measurementType, sessionType);

  const handleSelectSensor = (selectedSensor: string) => {
    setSensorParams(
      selectedSensor,
      sensors,
      isMobile,
      currentUserSettings,
      isIndoor,
      setUrlParams,
      dispatch
    );
  };

  useEffect(() => {
    setIsBasicOpen(basicSensorsModalOpen);
    setMoreOpen(customSensorsModalOpen);
  }, [basicSensorsModalOpen, customSensorsModalOpen]);

  return (
    <S.Wrapper>
      <SensorFilter isBasicOpen={isBasicOpen} />
      {!isMobile && isBasicOpen && (
        <S.FiltersOptionsWrapper>
          <S.BasicParameterWrapper>
            <S.FiltersOptionHeading>
              {t("filters.sensor")}
            </S.FiltersOptionHeading>
            {basicSensors?.map((item, id) => (
              <S.FiltersOptionButton
                onClick={() => handleSelectSensor(item)}
                $isSelected={item === sensorName}
                key={id}
              >
                {item}
              </S.FiltersOptionButton>
            ))}
            {customSensors.length > 0 && (
              <S.SeeMoreButton onClick={() => setMoreOpen(!moreOpen)}>
                <S.SeeMoreSpan>
                  {t(`filters.${moreOpen ? "seeLess" : "seeMore"}`)}
                </S.SeeMoreSpan>
                <img src={moreOpen ? minus : plus} />
              </S.SeeMoreButton>
            )}
          </S.BasicParameterWrapper>
          {moreOpen && <CustomSensorFilter customSensors={customSensors} />}
        </S.FiltersOptionsWrapper>
      )}
    </S.Wrapper>
  );
};

interface MobileDeviceSensorFilterProps {
  customSensors: string[];
  sessionsCount: number | undefined;
  onClose: () => void;
  fetchableSessionsCount: number;
}
export const MobileDeviceSensorFilter: React.FC<
  MobileDeviceSensorFilterProps
> = ({ customSensors, sessionsCount, onClose, fetchableSessionsCount }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const {
    measurementType,
    setUrlParams,
    sessionType,
    sensorName,
    currentUserSettings,
    isIndoor,
  } = useMapParams();
  const sensors = useAppSelector(selectSensors);
  const basicSensors = getBasicSensors(measurementType, sessionType);
  const isMobile = useMobileDetection();

  const handleSelectSensor = useCallback(
    (selectedSensor: string) => {
      setSensorParams(
        selectedSensor,
        sensors,
        isMobile,
        currentUserSettings,
        isIndoor,
        setUrlParams,
        dispatch
      );
    },
    [sensors, isMobile, currentUserSettings, isIndoor, setUrlParams, dispatch]
  );

  const handleShowMoreClick = () => {
    dispatch(setBasicSensorsModalOpen(false));
    dispatch(setCustomSensorsModalOpen(true));
  };

  return (
    <>
      <S.ModalContent>
        <S.Header>
          <S.ChevronBackButton
            onClick={() => dispatch(setBasicSensorsModalOpen(false))}
          >
            <img src={chevronLeft} />
          </S.ChevronBackButton>
          <S.HeaderTitle>{t("filters.selectSensor")}</S.HeaderTitle>
        </S.Header>
        <S.Description>{t("filters.selectSensorsDescription")}</S.Description>
        <S.BasicParameterButtonsWrapper>
          {basicSensors?.map((item, id) => (
            <S.BasicParameterButton
              key={id}
              onClick={() => handleSelectSensor(item)}
            >
              <S.ButtonSpan $isActive={item === sensorName}>
                {item}
              </S.ButtonSpan>
              {item === sensorName && <img src={checkmark} />}
            </S.BasicParameterButton>
          ))}
        </S.BasicParameterButtonsWrapper>
        {customSensors.length > 0 && (
          <S.GrayButton onClick={handleShowMoreClick}>
            {t("filters.showCustomSensors")}
          </S.GrayButton>
        )}
      </S.ModalContent>
      <S.ButtonsWrapper>
        <S.BackButton onClick={() => dispatch(setBasicSensorsModalOpen(false))}>
          {t("filters.back")}
        </S.BackButton>
        <S.MinorShowSessionsButton onClick={onClose}>
          {sessionType === SessionTypes.FIXED ? (
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
        </S.MinorShowSessionsButton>
      </S.ButtonsWrapper>
    </>
  );
};
