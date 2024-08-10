import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCombobox } from "downshift";
import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevron from "../../assets/icons/chevronRight.svg";
import minus from "../../assets/icons/minus.svg";
import plus from "../../assets/icons/plus.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import { setBasicPrametersModalOpen } from "../../store/sessionFiltersSlice";
import {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
  SessionTypes,
} from "../../types/filters";
import { Sensor } from "../../types/sensors";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const setSensor = (
  selectedParameter: ParameterType,
  sessionType: SessionType,
  sensors: Sensor[]
) => {
  const getSensor = (parameter: string) => {
    const allSensors = sensors.filter(
      (item) => item.measurementType === parameter
    );

    const firstSensor = allSensors[0];

    return firstSensor;
  };

  if (sessionType === SessionTypes.FIXED) {
    switch (selectedParameter) {
      case FixedBasicParameterTypes.PARTICULATE_MATTER:
        return {
          sensorName: "Government-PM2.5",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.HUMIDITY:
        return {
          sensorName: "AirBeam-RH",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.NITROGEN_DIOXIDE:
        return {
          sensorName: "Government-NO2",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.OZONE:
        return {
          sensorName: "Government-Ozone",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case FixedBasicParameterTypes.TEMPERATURE:
        return {
          sensorName: "AirBeam-F",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      default:
        return {
          sensorName: getSensor(selectedParameter).sensorName,
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
    }
  } else {
    switch (selectedParameter) {
      case MobileBasicParameterTypes.PARTICULATE_MATTER:
        return {
          sensorName: "AirBeam-PM2.5",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case MobileBasicParameterTypes.HUMIDITY:
        return {
          sensorName: "AirBeam-RH",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case MobileBasicParameterTypes.SOUND_LEVEL:
        return {
          sensorName: "Phone microphone",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      case MobileBasicParameterTypes.TEMPERATURE:
        return {
          sensorName: "AirBeam-F",
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
      default:
        return {
          sensorName: getSensor(selectedParameter).sensorName,
          unitSymbol: getSensor(selectedParameter).unitSymbol,
        };
    }
  }
};

const basicMeasurementTypes = (sessionType: SessionType) =>
  sessionType === SessionTypes.FIXED
    ? Object.values(FixedBasicParameterTypes)
    : Object.values(MobileBasicParameterTypes);

const ParameterFilter = () => {
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [items, setItems] = useState<string[]>([""]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const { t } = useTranslation();
  const { measurementType, setUrlParams, sessionType, currentUserSettings } =
    useMapParams();
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const parameters = useAppSelector(selectParameters);
  const sensors = useAppSelector(selectSensors);

  const handleShowParametersClick = () => {
    isMobile
      ? dispatch(setBasicPrametersModalOpen(true))
      : setIsBasicOpen(!isBasicOpen);
  };

  const handleOnMoreClick = () => {
    setMoreOpen(!moreOpen);
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
        value: setSensor(selectedParameter, sessionType, sensors).sensorName,
      },
      {
        key: UrlParamsTypes.unitSymbol,
        value: setSensor(selectedParameter, sessionType, sensors).unitSymbol,
      },
    ]);
    setIsBasicOpen(false);
  };

  const getParametersFilter = (inputValue: string) => {
    const lowerCasedInputValue = inputValue.toLowerCase();

    const parametersFilter = (parameter: string) => {
      return (
        !inputValue || parameter.toLowerCase().startsWith(lowerCasedInputValue)
      );
    };

    return parametersFilter;
  };

  const { getInputProps, getMenuProps, getItemProps } = useCombobox({
    items: parameters,
    inputValue,
    selectedItem,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue);
      setItems(parameters.filter(getParametersFilter(inputValue)));
    },
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      setUrlParams([
        {
          key: UrlParamsTypes.previousUserSettings,
          value: currentUserSettings,
        },
        {
          key: UrlParamsTypes.currentUserSettings,
          value: isMobile ? UserSettings.FiltersView : UserSettings.MapView,
        },
        {
          key: UrlParamsTypes.measurementType,
          value: newSelectedItem,
        },
        {
          key: UrlParamsTypes.sensorName,
          value: setSensor(newSelectedItem, sessionType, sensors).sensorName,
        },
        {
          key: UrlParamsTypes.unitSymbol,
          value: setSensor(newSelectedItem, sessionType, sensors).unitSymbol,
        },
      ]);
      setIsBasicOpen(false);
      setMoreOpen(false);

      setTimeout(() => {
        setLoading(true);
        setSelectedItem("");
      }, 200);
    },
  });

  useEffect(() => {
    setItems(parameters);
  }, [parameters]);

  return (
    <>
      <S.Wrapper>
        <S.SingleFilterWrapper>
          <S.SelectedOptionButton
            onClick={handleShowParametersClick}
            $isActive={isBasicOpen}
          >
            <S.SelectedOptionHeadingWrapper>
              <S.SelectedOptionHeading $isSelected={isBasicOpen}>
                {t("filters.parameter")}
              </S.SelectedOptionHeading>
              <S.SelectedOption $isSelected={isBasicOpen}>
                {measurementType}
              </S.SelectedOption>
            </S.SelectedOptionHeadingWrapper>
            <S.ChevronIcon $src={chevron} $isActive={isBasicOpen} />
          </S.SelectedOptionButton>
          <FilterInfoPopup filterTranslationLabel="filters.parameterInfo" />
        </S.SingleFilterWrapper>
        {!isMobile && isBasicOpen && (
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
              {moreOpen ? (
                <S.SeeMoreButton onClick={handleOnMoreClick}>
                  <S.SeeMoreSpan>{t("filters.seeLess")}</S.SeeMoreSpan>
                  <img src={minus} />
                </S.SeeMoreButton>
              ) : (
                <S.SeeMoreButton>
                  <S.SeeMoreSpan onClick={handleOnMoreClick}>
                    {t("filters.seeMore")}
                  </S.SeeMoreSpan>
                  <img src={plus} />
                </S.SeeMoreButton>
              )}
            </S.BasicParameterWrapper>
            {moreOpen && (
              <>
                <S.Hr />
                <S.CustomParameterWrapper>
                  <S.FiltersOptionHeading>
                    {t("filters.customParameters")}
                  </S.FiltersOptionHeading>
                  <S.CustomParametersListWrapper>
                    <S.CustomParametersInput
                      {...getInputProps({ value: inputValue })}
                    />
                    <S.CustomParameterList {...getMenuProps()}>
                      {items.map((item, index) => (
                        <li key={index} {...getItemProps({ item, index })}>
                          <S.CustomParameter>{item}</S.CustomParameter>
                        </li>
                      ))}
                    </S.CustomParameterList>
                  </S.CustomParametersListWrapper>
                </S.CustomParameterWrapper>
              </>
            )}
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
  const sensors = useAppSelector(selectSensors);

  const handleSelectParameter = (selectedParameter: ParameterType) => {
    dispatch(setLoading(true));
    setUrlParams([
      {
        key: UrlParamsTypes.measurementType,
        value: selectedParameter,
      },
      {
        key: UrlParamsTypes.sensorName,
        value: setSensor(selectedParameter, sessionType, sensors).sensorName,
      },
      {
        key: UrlParamsTypes.unitSymbol,
        value: setSensor(selectedParameter, sessionType, sensors).unitSymbol,
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
