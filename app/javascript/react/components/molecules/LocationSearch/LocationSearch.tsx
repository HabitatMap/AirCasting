import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMap } from "@vis.gl/react-google-maps";

import locationSearchIcon from "../../../assets/icons/locationSearchIcon.svg";
import { useAppDispatch } from "../../../store/hooks";
import { setFetchingData } from "../../../store/mapSlice";
import { getBrowserLocation } from "../../../utils/geolocation";
import { UrlParamsTypes, useMapParams } from "../../../utils/mapParamsHandler";
import useAutocompleteSuggestions, {
  PlaceSuggestion,
} from "../../../utils/useAutocompleteSuggestions";
import * as S from "./LocationSearch.style";

interface LocationSearchProps {
  isTimelapseView: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ isTimelapseView }) => {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [selectedItem, setSelectedItem] = useState<PlaceSuggestion | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const { t } = useTranslation();
  const map = useMap();
  const { setUrlParams } = useMapParams();

  const { setInput, suggestions, status, selectSuggestion } =
    useAutocompleteSuggestions();

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    onInputValueChange: ({ inputValue: newInputValue }) => {
      setInput(newInputValue);
      setInputValue(newInputValue);
    },
    items,
    itemToString(item) {
      return item ? item.label : "";
    },
    selectedItem,
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      setSelectedItem(newSelectedItem);
      if (newSelectedItem) handleSelect(newSelectedItem);
    },
    inputValue,
  });

  const displaySearchResults = isOpen && items.length > 0;

  const handleSelect = async (item: PlaceSuggestion) => {
    if (!item) return;

    const result = await selectSuggestion(item.id);
    if (!result) return;

    const { lat, lng, zoom, bounds } = result;

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
    if (status === "ok" && suggestions.length) {
      setItems(suggestions);
    } else if (status === "no_results" || status === "idle") {
      setItems([]);
    }
  }, [suggestions, status]);

  return (
    <S.SearchContainer $isTimelapseView={isTimelapseView}>
      <S.SearchInput
        placeholder={t("map.searchPlaceholder")}
        $displaySearchResults={displaySearchResults}
        {...getInputProps()}
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
              key={item.id}
              $isHighlighted={highlightedIndex === index}
              {...getItemProps({ item, index })}
            >
              {item.label}
            </S.Suggestion>
          ))}
      </S.SuggestionsList>
    </S.SearchContainer>
  );
};

export { LocationSearch };
