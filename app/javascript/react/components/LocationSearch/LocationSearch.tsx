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
import { setLocation } from "../../store/mapSlice";
import * as S from "./LocationSearch.style";

interface LocationSearchProps {
  isMapPage?: boolean;
}

type AutocompletePrediction = google.maps.places.AutocompletePrediction;

const LocationSearch: React.FC<LocationSearchProps> = ({ isMapPage }) => {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<AutocompletePrediction[]>([]);
  const [selectedItem, setSelectedItem] =
    useState<AutocompletePrediction | null>(null);
  const [inputValue, setInputValue] = useState("");
  const { t } = useTranslation();
  const map = useMap();

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

  const handleSelect = async (item: AutocompletePrediction) => {
    if (!item) return;

    setValue(item.description, false);
    clearSuggestions();
    const results = await getGeocode({ address: item.description });
    const { lat, lng } = await getLatLng(results[0]);
    dispatch(setLocation({ lat, lng }));

    const zoomLevel = determineZoomLevel(results);

    map?.setZoom(zoomLevel);
    map?.panTo({ lat, lng });
  };

  const determineZoomLevel = (results: google.maps.GeocoderResult[]) => {
    if (results[0].types.includes("locality")) {
      return 12;
    } else if (results[0].types.includes("country")) {
      return 6;
    }
    return 10;
  };

  useEffect(() => {
    status === "OK" && data.length && setItems(data);
  }, [data, status]);

  return (
    <>
      <S.SearchContainer>
        <S.SearchInput
          placeholder={t("map.searchPlaceholder")}
          {...getInputProps()}
        />
        {!isMapPage && (
          <S.LocationSearchButton
            aria-label={t("map.toggleMenu")}
            type="button"
            {...getToggleButtonProps()}
          >
            <img src={locationSearchIcon} alt={t("map.searchIcon")} />
          </S.LocationSearchButton>
        )}
        <S.SuggestionsList {...getMenuProps()}>
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
    </>
  );
};

export { LocationSearch };
