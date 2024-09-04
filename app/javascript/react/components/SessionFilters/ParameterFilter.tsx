import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import checkmark from "../../assets/icons/checkmarkBlue.svg";
import chevronLeft from "../../assets/icons/chevronLeft.svg";
import chevron from "../../assets/icons/chevronRight.svg";
import minus from "../../assets/icons/minus.svg";
import plus from "../../assets/icons/plus.svg";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { selectParameters, selectSensors } from "../../store/sensorsSlice";
import {
  selectBasicParametersModalOpen,
  selectCustomParametersModalOpen,
  setBasicParametersModalOpen,
  setBasicSensorsModalOpen,
  setCustomParametersModalOpen,
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
    ? FixedBasicParameterTypes
    : MobileBasicParameterTypes;

interface ParameterFilterProps {
  isBasicOpen: boolean;
}

export const filterCustomParameters = (
  parameters: string[],
  sessionType: string
) => {
  const basicParameters =
    sessionType === SessionTypes.FIXED
      ? FixedBasicParameterTypes
      : MobileBasicParameterTypes;

  return parameters.filter((param: string) => !basicParameters.includes(param));
};

export const ParameterFilter: React.FC<ParameterFilterProps> = ({
  isBasicOpen,
}) => {
  const { t } = useTranslation();
  const { measurementType } = useMapParams();
  const dispatch = useAppDispatch();
  const basicParametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );

  const handleShowParametersClick = () => {
    dispatch(setBasicParametersModalOpen(!basicParametersModalOpen));
    dispatch(setBasicSensorsModalOpen(false));
  };

  return (
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
  );
};

export const DesktopParameterFilter = () => {
  const [isBasicOpen, setIsBasicOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useTranslation();
  const {
    measurementType,
    setUrlParams,
    sessionType,
    currentUserSettings,
    isIndoor,
  } = useMapParams();
  const dispatch = useAppDispatch();
  const isMobile = useMobileDetection();
  const sensors = useAppSelector(selectSensors);
  const basicParametersModalOpen = useAppSelector(
    selectBasicParametersModalOpen
  );
  const customParametersModalOpen = useAppSelector(
    selectCustomParametersModalOpen
  );
  const parameters = useAppSelector(selectParameters);
  const customParameters = filterCustomParameters(parameters, sessionType);

  const handleOnMoreClick = () => {
    setMoreOpen(!moreOpen);
  };

  const handleSelectParameter = (selectedParameter: ParameterType) => {
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
        key: UrlParamsTypes.sessionId,
        value: "",
      },
      {
        key: UrlParamsTypes.streamId,
        value: "",
      },
      {
        key: UrlParamsTypes.measurementType,
        value: selectedParameter,
      },
      {
        key: UrlParamsTypes.sensorName,
        value: setSensor(selectedParameter, sensors, sessionType).sensorName,
      },
      {
        key: UrlParamsTypes.unitSymbol,
        value: setSensor(selectedParameter, sensors, sessionType).unitSymbol,
      },
      {
        key: UrlParamsTypes.currentZoom,
        value: UrlParamsTypes.previousZoom,
      },
    ];

    setUrlParams(commonParams);

    const sensorName = setSensor(
      selectedParameter,
      sensors,
      sessionType
    ).sensorName;
    if (isIndoor && sensorName.startsWith("Gov")) {
      setUrlParams([
        ...commonParams,
        {
          key: UrlParamsTypes.isIndoor,
          value: "false",
        },
      ]);
    }

    dispatch(setBasicParametersModalOpen(false));
    dispatch(setFetchingData(true));
  };

  useEffect(() => {
    setIsBasicOpen(basicParametersModalOpen);
    setMoreOpen(customParametersModalOpen);
  }, [basicParametersModalOpen]);

  return (
    <S.Wrapper>
      <ParameterFilter isBasicOpen={isBasicOpen} />
      {!isMobile && isBasicOpen && (
        <S.FiltersOptionsWrapper>
          <S.BasicParameterWrapper>
            <S.FiltersOptionHeading>
              {t("filters.parameter")}
            </S.FiltersOptionHeading>
            {basicMeasurementTypes(sessionType).map((item, id) => (
              <S.FiltersOptionButton
                $isSelected={item === measurementType}
                key={id}
                onClick={() => handleSelectParameter(item)}
              >
                {item}
              </S.FiltersOptionButton>
            ))}
            {customParameters.length > 0 &&
              (moreOpen ? (
                <S.SeeMoreButton onClick={handleOnMoreClick}>
                  <S.SeeMoreSpan>{t("filters.seeLess")}</S.SeeMoreSpan>
                  <img src={minus} />
                </S.SeeMoreButton>
              ) : (
                <S.SeeMoreButton onClick={handleOnMoreClick}>
                  <S.SeeMoreSpan>{t("filters.seeMore")}</S.SeeMoreSpan>
                  <img src={plus} />
                </S.SeeMoreButton>
              ))}
          </S.BasicParameterWrapper>
          {moreOpen && (
            <CustomParameterFilter customParameters={customParameters} />
          )}
        </S.FiltersOptionsWrapper>
      )}
    </S.Wrapper>
  );
};

interface MobileDeviceParameterFilterProps {
  customParameters: string[];
  sessionsCount: number | undefined;
  onClose: () => void;
  fetchableSessionsCount: number;
}

export const MobileDeviceParameterFilter = ({
  customParameters,
  sessionsCount,
  onClose,
  fetchableSessionsCount,
}: MobileDeviceParameterFilterProps) => {
  const dispatch = useAppDispatch();
  const sensors = useAppSelector(selectSensors);
  const { t } = useTranslation();
  const { measurementType, updateMeasurementType, sessionType } =
    useMapParams();

  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  const handleSelectParameter = (selectedParameter: ParameterType) => {
    updateMeasurementType(selectedParameter, sensors);
    dispatch(setFetchingData(true));
  };

  const handleShowMoreClick = () => {
    dispatch(setBasicParametersModalOpen(false));
    dispatch(setCustomParametersModalOpen(true));
  };

  return (
    <>
      <S.ModalContent>
        <S.Header>
          <S.ChevronBackButton
            onClick={() => dispatch(setBasicParametersModalOpen(false))}
          >
            <img src={chevronLeft} />
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
        {customParameters?.length > 0 && (
          <S.GrayButton onClick={handleShowMoreClick}>
            {t("filters.showCustomParameters")}
          </S.GrayButton>
        )}
      </S.ModalContent>
      <S.ButtonsWrapper>
        <S.BackButton
          onClick={() => dispatch(setBasicParametersModalOpen(false))}
        >
          {t("filters.back")}
        </S.BackButton>
        <S.MinorShowSessionsButton onClick={onClose}>
          {fixedSessionTypeSelected ? (
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
