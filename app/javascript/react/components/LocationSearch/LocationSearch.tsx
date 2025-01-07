import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import { useMap } from "@vis.gl/react-google-maps";

import locationSearchIcon from "../../assets/icons/locationSearchIcon.svg";
import { useAppDispatch } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import { determineZoomLevel } from "../../utils/determineZoomLevel";
import { getBrowserLocation } from "../../utils/geolocation";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./LocationSearch.style";

const OK_STATUS = "OK";

interface LocationSearchProps {
  isTimelapseView: boolean;
}

type AutocompletePrediction = google.maps.places.AutocompletePrediction;

const LocationSearch: React.FC<LocationSearchProps> = ({ isTimelapseView }) => {
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

  const displaySearchResults = isOpen && items.length > 0;

  const handleSelect = async (item: AutocompletePrediction) => {
    if (!item) return;

    setValue(item.description, false);
    clearSuggestions();
    const results = await getGeocode({ address: item.description });
    const { lat, lng } = await getLatLng(results[0]);
    const { zoom, bounds } = determineZoomLevel(results);

    setUrlParams([
      {
        key: UrlParamsTypes.currentCenter,
        value: JSON.stringify({ lat, lng }),
      },
      {
        key: UrlParamsTypes.currentZoom,
        value: zoom.toString(),
      },
    ]);

    if (bounds && map) {
      map.fitBounds(bounds);
    } else {
      map?.setZoom(zoom);
      map?.panTo({ lat, lng });
    }

    setTimeout(() => {
      dispatch(setFetchingData(true));
    }, 200);
  };

  const handleBrowserLocation = async () => {
    const location = await getBrowserLocation(map, setUrlParams);

    if (location) {
      setInputValue("");
      setItems([]);
      setTimeout(() => {
        dispatch(setFetchingData(true));
      }, 200);
    } else {
      console.log(t("map.locationError"));
    }
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
      <S.LocationSearchButton
        aria-label={t("map.browserLocationButton")}
        type="button"
        onClick={handleBrowserLocation}
      >
        <S.LocationSearchIcon
          src={locationSearchIcon}
          alt={t("map.searchIcon")}
        />
      </S.LocationSearchButton>
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
