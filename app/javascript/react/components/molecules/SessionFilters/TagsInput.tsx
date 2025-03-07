import { useCombobox } from "downshift";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TRUE } from "../../../const/booleans";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setFetchingData } from "../../../store/mapSlice";
import {
  fetchTags,
  selectIsTagsInputFetching,
  selectTags,
} from "../../../store/sessionFiltersSlice";
import { ParamsType, SessionTypes } from "../../../types/filters";
import { UrlParamsTypes, useMapParams } from "../../../utils/mapParamsHandler";
import { Spinner } from "../../atoms/Loader/Spinner";
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
    sensorName,
    sessionType,
    setFilter,
    tags,
    timeFrom,
    timeTo,
    unitSymbol,
    usernames,
    isIndoor,
    isActive,
  } = useMapParams();

  const isFirstRender = useRef(true);

  const tagsToSelect = useAppSelector(selectTags);

  const selectedSessionType = sessionType || SessionTypes.FIXED;
  const isTagsInputFetching = useAppSelector(selectIsTagsInputFetching);

  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const usernamesDecoded = usernames && decodeURIComponent(usernames);

  const getQueryParams = (tags: string): ParamsType => {
    return {
      tags: tags,
      west: boundWest.toString(),
      east: boundEast.toString(),
      south: boundSouth.toString(),
      north: boundNorth.toString(),
      timeFrom: timeFrom,
      timeTo: timeTo,
      usernames: usernamesDecoded,
      sensorName: sensorName,
      unitSymbol: preparedUnitSymbol,
      sessionType: selectedSessionType,
      isIndoor: isIndoor === TRUE,
      isActive: isActive,
    };
  };

  const getTagsToSelectFiltered = (tagsToBeExcluded: "" | string[] | null) => {
    return tagsToBeExcluded
      ? tagsToSelect.filter((tag) => !tagsToBeExcluded.includes(tag))
      : tagsToSelect;
  };

  const { isOpen, getMenuProps, getInputProps, getItemProps, reset } =
    useCombobox({
      items: items,
      inputValue,
      selectedItem,
      onInputValueChange: ({ inputValue }) => {
        setInputValue(inputValue);

        const tagsToSelectFiltered = getTagsToSelectFiltered(decodedTagsArray);

        const filteredTags = inputValue
          ? tagsToSelectFiltered.filter((tag) =>
              tag.toLowerCase().startsWith(inputValue.toLowerCase())
            )
          : decodedTagsArray
          ? tagsToSelect.filter((tag) => !decodedTagsArray.includes(tag))
          : tagsToSelect;

        setItems(filteredTags);
      },
      onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
        if (
          newSelectedItem !== null &&
          !decodedTagsArray?.includes(newSelectedItem)
        ) {
          const decodedTags = tags && decodeURIComponent(tags);
          const selectedTags = decodedTags + ", " + newSelectedItem;

          const urlEncodedString = encodeURIComponent(selectedTags);
          setFilter(UrlParamsTypes.tags, urlEncodedString.toString());
          reset();
          setSelectedItem("");
          const tagsToSelectFiltered =
            getTagsToSelectFiltered(decodedTagsArray);
          setItems(tagsToSelectFiltered);
        }
      },
    });

  const handleOnInputClick = () => {
    const queryParams = getQueryParams(inputValue);
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
    setFilter(UrlParamsTypes.tags, decodedTagsString.toString());

    const tagsToSelectFiltered = getTagsToSelectFiltered(tagsUpdated);

    setItems(tagsToSelectFiltered);
  };

  useEffect(() => {
    const tagsToSelectFiltered = getTagsToSelectFiltered(decodedTagsArray);
    setItems(tagsToSelectFiltered);
  }, [tagsToSelect]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      dispatch(setFetchingData(true));
    }, 200);

    return () => clearTimeout(timer);
  }, [tags, dispatch]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.InputWrapper>
          <S.Input
            placeholder={t("filters.tags")}
            {...getInputProps({
              value: inputValue,
              onClick: handleOnInputClick,
            })}
          />
          {isTagsInputFetching && <Spinner />}
        </S.InputWrapper>
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
