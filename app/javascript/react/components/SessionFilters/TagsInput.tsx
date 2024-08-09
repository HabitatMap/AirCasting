import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { fetchTags, selectTags } from "../../store/sessionFiltersSlice";
import { SessionTypes, fetchTagsParamsType } from "../../types/filters";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const TagsInput = () => {
  const [items, setItems] = useState<string[]>([""]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const {
    boundWest,
    boundEast,
    boundNorth,
    boundSouth,
    initialSensorName,
    sessionType,
    setFilters,
    tags,
    initialUnitSymbol,
    usernames,
  } = useMapParams();

  const tagsToSelect = useAppSelector(selectTags);

  const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;
  const selectedSessionType = sessionType || SessionTypes.FIXED;

  const preparedUnitSymbol = initialUnitSymbol.replace(/"/g, "");

  // Filters (temporary solution)
  const sensorName = fixedSessionTypeSelected
    ? initialSensorName
    : "AirBeam-PM2.5";

  const queryParams: fetchTagsParamsType = {
    tag: inputValue,
    west: boundWest.toString(),
    east: boundEast.toString(),
    south: boundSouth.toString(),
    north: boundNorth.toString(),
    timeFrom: "1685318400",
    timeTo: "1717027199",
    usernames: usernames,
    sensorName: sensorName,
    unitSymbol: preparedUnitSymbol,
    sessionType: selectedSessionType,
  };

  const { isOpen, getMenuProps, getInputProps, getItemProps, reset } =
    useCombobox({
      items: tagsToSelect,
      inputValue,
      selectedItem,
      onInputValueChange: ({ inputValue }) => {
        dispatch(fetchTags(queryParams));
        setInputValue(inputValue);
      },
      onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
        if (
          newSelectedItem !== null &&
          !decodedTagsArray?.includes(newSelectedItem)
        ) {
          const decodedTags = tags && decodeURIComponent(tags);
          const selectedTags = decodedTags + ", " + newSelectedItem;

          const urlEncodedString = encodeURIComponent(selectedTags);
          setFilters(UrlParamsTypes.tags, urlEncodedString.toString());
          setTimeout(() => {
            dispatch(setLoading(true));
          }, 200);
          reset();
          setSelectedItem("");
        }
      },
    });

  const handleOnInputClick = () => {
    dispatch(fetchTags(queryParams));
  };

  const decodedTagsArray =
    tags &&
    decodeURIComponent(tags)
      .split(", ")
      .filter((el) => el !== "");

  const displaySearchResults = isOpen && items.length > 0;

  const handleOnClose = (itemToRemove: string) => {
    const tagsUpdated =
      decodedTagsArray && decodedTagsArray.filter((el) => el !== itemToRemove);
    const decodedTagsString = tagsUpdated ? tagsUpdated.join(", ") : "";
    setFilters(UrlParamsTypes.tags, decodedTagsString.toString());
    setTimeout(() => {
      dispatch(setLoading(true));
    }, 200);
  };

  useEffect(() => {
    setItems(tagsToSelect);
  }, [tagsToSelect]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.Input
          placeholder={t("filters.tagsNames")}
          {...getInputProps({ value: inputValue, onClick: handleOnInputClick })}
        />
        <FilterInfoPopup filterTranslationLabel="filters.tagNamesInfo" />
      </S.SingleFilterWrapper>

      {decodedTagsArray && decodedTagsArray.length > 0 && (
        <S.SelectedItemsWrapper>
          {decodedTagsArray.map((item, index) => (
            <S.SelectedItemTile key={index}>
              <S.SelectedItem>{item}</S.SelectedItem>
              <S.CloseSelectedItemButton onClick={() => handleOnClose(item)} />
            </S.SelectedItemTile>
          ))}
        </S.SelectedItemsWrapper>
      )}
      <S.SuggestionList
        $displaySearchResults={displaySearchResults}
        {...getMenuProps()}
      >
        {items.map((item, index) => (
          <S.Suggestion key={index} {...getItemProps({ item, index })}>
            {item}
          </S.Suggestion>
        ))}
      </S.SuggestionList>
    </S.Wrapper>
  );
};

export { TagsInput };
