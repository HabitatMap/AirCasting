import { useCombobox } from "downshift";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import locationSearchIcon from "../../assets/icons/locationSearchIcon.svg";
import { LatLngLiteral } from "../../types/googleMaps";
import * as S from "./LocationSearch.style";

interface LocationSearchProps {
  setLocation: (position: LatLngLiteral) => void;
  isMapPage?: boolean;
}

type AutocompletePrediction = google.maps.places.AutocompletePrediction;

const LocationSearch = ({ setLocation, isMapPage }: LocationSearchProps) => {
  const [items, setItems] = React.useState<AutocompletePrediction[]>([]);
  const [selectedItem, setSelectedItem] =
    React.useState<AutocompletePrediction>();

  const { t } = useTranslation();

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
    onInputValueChange({ inputValue }) {
      setValue(inputValue);
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
  });

  const handleSelect = async (item: AutocompletePrediction) => {
    if (!item) return;

    setValue(item.description, false);
    clearSuggestions();
    const results = await getGeocode({ address: item.description });
    const { lat, lng } = await getLatLng(results[0]);
    setLocation({ lat, lng });
  };

  useEffect(() => {
    status === "OK" && data.length && setItems(data);
  }, [data, status]);
  {
    t("map.mapSatelliteLabel");
  }

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
      </S.SearchContainer>
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
    </>
  );
};

export { LocationSearch };
