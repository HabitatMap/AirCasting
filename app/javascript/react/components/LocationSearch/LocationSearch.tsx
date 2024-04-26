import React, { useEffect } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useCombobox } from "downshift";

import { LatLngLiteral } from "../../types/googleMaps";
import { Suggestion, SuggestionsList } from "./LocationSearch.style";

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
      <div>
        <input placeholder="Best book ever" {...getInputProps()} />
        <button
          aria-label="toggle menu"
          type="button"
          {...getToggleButtonProps()}
        >
          {isOpen ? <>&#8593;</> : <>&#8595;</>}
        </button>
      </div>
      <SuggestionsList {...getMenuProps()}>
        {isOpen &&
          items.map((item, index) => (
            <Suggestion
              key={item.place_id}
              $isHighlighted={highlightedIndex === index}
              {...getItemProps({ item, index })}
            >
              {item.description}
            </Suggestion>
          ))}
      </SuggestionsList>
    </>
  );
};

export { LocationSearch };
