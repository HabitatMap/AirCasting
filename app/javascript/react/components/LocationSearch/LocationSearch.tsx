import React, { useEffect } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useCombobox } from "downshift";

import { LatLngLiteral } from "../../types/googleMaps";
import * as S from "./LocationSearch.style";
import locationSearchIcon from "../../assets/icons/locationSearchIcon.svg";
import { SearchContainer } from "../Navbar/Navbar.style";

interface LocationSearchProps {
  setLocation: (position: LatLngLiteral) => void;
}

type AutocompletePrediction = google.maps.places.AutocompletePrediction;

const LocationSearch = ({ setLocation }: LocationSearchProps) => {
  const {
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (item: AutocompletePrediction) => {
    if (!item) return;

    setValue(item.description, false);
    clearSuggestions();
    const results = await getGeocode({ address: item.description });
    const { lat, lng } = await getLatLng(results[0]);
    setLocation({ lat, lng });
  };

  const [items, setItems] = React.useState<AutocompletePrediction[]>([]);
  const [selectedItem, setSelectedItem] =
    React.useState<AutocompletePrediction>();

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

  useEffect(() => {
    status === "OK" && data.length && setItems(data);
  }, [data, status]);

  return (
    <>
      <S.SearchContainer>
        <S.SearchInput placeholder="Search for location" {...getInputProps()} />
        <S.LocationSearchButton
          aria-label="toggle menu"
          type="button"
          {...getToggleButtonProps()}
        >
          <img src={locationSearchIcon} alt="location search icon" />
        </S.LocationSearchButton>
      </S.SearchContainer>
      {/* <S.SuggestionsList {...getMenuProps()}>
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
      </S.SuggestionsList> */}
    </>
  );
};

export { LocationSearch };
