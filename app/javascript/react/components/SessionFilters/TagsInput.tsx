import React, { useEffect, useState } from "react";

import { useCombobox } from "downshift";
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
    setUrlParams,
    tags,
    boundWest,
    boundEast,
    boundNorth,
    boundSouth,
    usernames,
    initialSensorName,
    initialUnitSymbol,
    sessionType,
  } = useMapParams();

  const tagsToSelect = useAppSelector(selectTags);

  const fixedSessionTypeSelected = sessionType === SessionTypes.FIXED;
  const selectedSessionType = sessionType || SessionTypes.FIXED;

  // Filters (temporary solution)
  const sensorName = fixedSessionTypeSelected
    ? initialSensorName
    : "AirBeam-PM2.5";

  const { isOpen, getMenuProps, getInputProps, getItemProps, reset } =
    useCombobox({
      items: tagsToSelect,
      inputValue,
      selectedItem,
      onInputValueChange: ({ inputValue }) => {
        const preparedUnitSymbol = initialUnitSymbol.replace(/"/g, "");

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

        dispatch(fetchTags(queryParams));
        setInputValue(inputValue);
      },
      onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
        if (newSelectedItem !== null) {
          const decodedTags = tags && decodeURIComponent(tags);
          const selectedTags = decodedTags + ", " + newSelectedItem;

          const urlEncodedString = encodeURIComponent(selectedTags);
          setUrlParams([
            {
              key: UrlParamsTypes.tags,
              value: urlEncodedString.toString(),
            },
          ]);

          dispatch(setLoading(true));
          reset();
          setSelectedItem("");
        }
      },
    });

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
    setUrlParams([
      {
        key: UrlParamsTypes.tags,
        value: decodedTagsString.toString(),
      },
    ]);

    dispatch(setLoading(true));
  };

  useEffect(() => {
    setItems(tagsToSelect);
  }, [tagsToSelect]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.Input
          placeholder={t("filters.tagsNames")}
          {...getInputProps({ value: inputValue })}
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