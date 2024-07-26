import React, { useEffect, useState } from "react";

import { useCombobox } from "downshift";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import { fetchTags, selectTags } from "../../store/sessionFiltersSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const TagsInput = () => {
  const [items, setItems] = useState([""]);
  const [inputValue, setInputValue] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
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
  } = useMapParams();

  const tagsToSelect = useAppSelector(selectTags);

  const { isOpen, getMenuProps, getInputProps, getItemProps, reset } =
    useCombobox({
      items: tagsToSelect,
      inputValue,
      selectedItem,
      onInputValueChange: ({ inputValue }) => {
        const preparedUnitSymbol = initialUnitSymbol.replace(/"/g, "");

        const queryParams = {
          tag: inputValue,
          west: boundWest.toString(),
          east: boundEast.toString(),
          south: boundSouth.toString(),
          north: boundNorth.toString(),
          timeFrom: "1685318400",
          timeTo: "1717027199",
          usernames: usernames,
          sensorName: initialSensorName,
          unitSymbol: preparedUnitSymbol,
        };

        console.log("queryParams", queryParams);
        dispatch(fetchTags(queryParams));
        setInputValue(inputValue);
      },
      // onSelectedItemChange: ({ selectedItem }) => {
      //   const decodedUsernames = decodeURIComponent(tags);
      //   const selectedUsernames = decodedUsernames + ", " + selectedItem;

      //   const urlEncodedString = encodeURIComponent(selectedUsernames);
      //   setUrlParams([
      //     {
      //       key: UrlParamsTypes.tags,
      //       value: urlEncodedString.toString(),
      //     },
      //   ]);

      //   dispatch(setLoading(true));
      //   reset();
      // },
    });

  console.log("items", items);

  const decodedTagsArray = decodeURIComponent(tags)
    .split(", ")
    .filter((el) => el !== "");

  const displaySearchResults = isOpen && items.length > 0;

  const handleOnClose = (itemToRemove: string) => {
    const tagsUpdated = decodedTagsArray.filter((el) => el !== itemToRemove);
    const decodedTagsString = tagsUpdated.join(", ");

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
    <>
      <S.SingleFilterWrapper>
        <S.Input
          // do translacji
          placeholder="tags names"
          {...getInputProps({ value: inputValue })}
        />
        <FilterInfoPopup filterTranslationLabel="filters.profileInfo" />
      </S.SingleFilterWrapper>

      {decodedTagsArray && decodedTagsArray.length > 0 && (
        <S.SelectedUsernamesWrapper>
          {decodedTagsArray.map((item, index) => (
            <S.SelectedUsernameTile
            // key={index}
            >
              <S.SelectedUsername>{item}</S.SelectedUsername>
              <S.CloseSelectedUsernameButton
                onClick={() => handleOnClose(item)}
              />
            </S.SelectedUsernameTile>
          ))}
        </S.SelectedUsernamesWrapper>
      )}
      <S.SuggestionList
        $displaySearchResults={displaySearchResults}
        {...getMenuProps()}
      >
        {/* {items.map((item, index) => (
          <S.Suggestion key={index} {...getItemProps({ item, index })}>
            {item}
          </S.Suggestion>
        ))} */}
      </S.SuggestionList>
    </>
  );
};

export { TagsInput };
