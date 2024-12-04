import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import { useMap } from "@vis.gl/react-google-maps";

import locationSearchIcon from "../../assets/icons/locationSearchIcon.svg";
import { cleanSessions } from "../../store/fixedSessionsSlice";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { clearMobileSessions } from "../../store/mobileSessionsSlice";
import * as Cookies from "../../utils/cookies";
import { determineZoomLevel } from "../../utils/determineZoomLevel";
import { updateMapBounds } from "../../utils/mapBoundsHandler";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { screenSizes } from "../../utils/media";
import useScreenSizeDetection from "../../utils/useScreenSizeDetection";
import * as S from "./LocationSearch.style";

const OK_STATUS = "OK";

interface LocationSearchProps {
  isMapPage?: boolean;
  isTimelapseView: boolean;
}

type AutocompletePrediction = google.maps.places.AutocompletePrediction;

const LocationSearch: React.FC<LocationSearchProps> = ({
  isMapPage,
  isTimelapseView,
}) => {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<AutocompletePrediction[]>([]);
  const [selectedItem, setSelectedItem] =
    useState<AutocompletePrediction | null>(null);
  const [inputValue, setInputValue] = useState("");
  const { t } = useTranslation();
  const map = useMap();
  const { setUrlParams } = useMapParams();
  const {
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    onInputValueChange: ({ inputValue }) => {
      setValue(inputValue);
      setInputValue(inputValue);
    },
    items: data,
    itemToString(item) {
      return item ? item.description : "";
    },
    selectedItem,
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      setSelectedItem(newSelectedItem);
      handleSelect(newSelectedItem);
    },
    inputValue,
  });

  const isSmallDesktop = useScreenSizeDetection(screenSizes.mediumDesktop);

  const displaySearchResults = isOpen && items.length > 0;

  const handleSelect = async (item: AutocompletePrediction) => {
    if (!item) return;

    setValue(item.description, false);
    clearSuggestions();
    const results = await getGeocode({ address: item.description });
    const { lat, lng } = await getLatLng(results[0]);
    const { zoom, bounds } = determineZoomLevel(results);

    const newSearchParams = new URLSearchParams(window.location.search);

    const currentCenter = JSON.stringify({ lat, lng });
    const currentZoom = zoom.toString();
    newSearchParams.set(UrlParamsTypes.currentCenter, currentCenter);
    newSearchParams.set(UrlParamsTypes.currentZoom, currentZoom);
    Cookies.set(UrlParamsTypes.currentCenter, currentCenter);
    Cookies.set(UrlParamsTypes.currentZoom, currentZoom);

    if (bounds && map) {
      map.fitBounds(bounds);
    } else {
      map?.setZoom(zoom);
      map?.panTo({ lat, lng });
    }

    updateMapBounds(map, newSearchParams);

    setUrlParams([
      {
        key: UrlParamsTypes.currentCenter,
        value: currentCenter,
      },
      {
        key: UrlParamsTypes.currentZoom,
        value: currentZoom,
      },
    ]);

    dispatch(clearMobileSessions());
    dispatch(cleanSessions());
    dispatch(setFetchingData(true));
  };

  useEffect(() => {
    if (status === OK_STATUS && data.length) {
      setItems(data);
    }
  }, [data, status]);

  return (
    <S.SearchContainer $isTimelapseView={isTimelapseView}>
      <S.SearchInput
        placeholder={t("map.searchPlaceholder")}
        $displaySearchResults={displaySearchResults}
        {...getInputProps()}
        $isTimelapsView={isTimelapseView}
      />
      {!isMapPage && !isSmallDesktop && (
        <S.LocationSearchButton
          aria-label={t("map.toggleMenu")}
          type="button"
          {...getToggleButtonProps()}
        >
          <img src={locationSearchIcon} alt={t("map.searchIcon")} />
        </S.LocationSearchButton>
      )}
      <S.SuggestionsList
        $displaySearchResults={displaySearchResults}
        {...getMenuProps()}
      >
        <S.Hr $displaySearchResults={displaySearchResults} />
        {isOpen &&
          items.map((item, index) => (
            <S.Suggestion
              key={item.place_id}
              $isHighlighted={highlightedIndex === index}
              {...getItemProps({ item, index })}
            >
              {item.description}
            </S.Suggestion>
          ))}
      </S.SuggestionsList>
    </S.SearchContainer>
  );
};

export { LocationSearch };
