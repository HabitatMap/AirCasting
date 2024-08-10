import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevron from "../../assets/icons/chevronRight.svg";
import minus from "../../assets/icons/minus.svg";
import plus from "../../assets/icons/plus.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicParametersModalOpen,
  setBasicPrametersModalOpen,
} from "../../store/sessionFiltersSlice";
import {
  FixedBasicParameterTypes,
  MobileBasicParameterTypes,
  ParameterType,
  SessionType,
  SessionTypes,
} from "../../types/filters";
import { UserSettings } from "../../types/userStates";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { setSensor } from "../../utils/setSensor";
import useMobileDetection from "../../utils/useScreenSizeDetection";
import { CustomParameterFilter } from "./CustomParameterFilter";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const basicMeasurementTypes = (sessionType: SessionType) =>
  sessionType === SessionTypes.FIXED
    ? Object.values(FixedBasicParameterTypes)
    : Object.values(MobileBasicParameterTypes);

const DesktopParameterFilter = () => {
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useTranslation();
  const { measurementType, setUrlParams, sessionType, currentUserSettings } =
    useMapParams();
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const sensors = useAppSelector(selectSensors);
  const basicPrametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );

  const handleShowParametersClick = () => {
    dispatch(setBasicPrametersModalOpen(true));
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
    dispatch(setBasicPrametersModalOpen(false));
  };

  useEffect(() => {
    setIsBasicOpen(basicPrametersModalOpen);
  }, [basicPrametersModalOpen]);

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
            {moreOpen && <CustomParameterFilter />}
          </S.FiltersOptionsWrapper>
        )}
      </S.Wrapper>
    </>
  );
};

export { DesktopParameterFilter };

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
