import React, { useEffect, useState } from "react";

import { useCombobox } from "downshift";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import {
  fetchUsernames,
  // removeSelectedUsername,
  // selectSelectedUsernames,
  selectUsernames,
} from "../../store/sessionFiltersSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const ProfileNamesInput = () => {
  const [items, setItems] = useState([""]);
  const [inputValue, setInputValue] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedUsernames, setSelectedUsernames] = useState([""]);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { setUrlParams, usernames } = useMapParams();

  // const selectedUsernames = useAppSelector(selectSelectedUsernames);

  const profileNames = useAppSelector(selectUsernames);
  const joinedUsernames = selectedUsernames.join(",");
  const jsonString = `${joinedUsernames}`;
  console.log("jsonString", jsonString);
  const urlEncodedString = encodeURIComponent(jsonString);

  const { isOpen, getMenuProps, getInputProps, getItemProps, reset } =
    useCombobox({
      items: profileNames,
      inputValue,
      selectedItem,
      onInputValueChange: ({ inputValue }) => {
        dispatch(fetchUsernames(inputValue));
        setInputValue(inputValue);
      },
      onSelectedItemChange: ({ selectedItem }) => {
        selectedItem !== null &&
          setSelectedUsernames((prevState) => [...prevState, selectedItem]);

        setUrlParams([
          {
            key: UrlParamsTypes.usernames,
            value: urlEncodedString,
          },
        ]);
        // dispatch(setSelectedUsername(selectedItem)) &&

        dispatch(setLoading(true)) && reset();
      },
    });

  const displaySearchResults = isOpen && items.length > 0;

  const handleOnClose = (itemToRemove: string) => {
    // dispatch(removeSelectedUsername(itemToRemove));
    dispatch(setLoading(true));
  };

  useEffect(() => {
    setItems(profileNames);
  }, [profileNames]);

  console.log("usernames", usernames);

  return (
    <>
      <S.SingleFilterWrapper>
        <S.Input
          placeholder="profile names"
          {...getInputProps({ value: inputValue })}
        />
        <FilterInfoPopup filterTranslationLabel="filters.profileInfo" />
      </S.SingleFilterWrapper>

      {/* {selectedUsernames.length > 0 && ( */}
      <S.SelectedUsernamesWrapper>
        {/* {selectedUsernames.map((item, index) => ( */}
        <S.SelectedUsernameTile
        // key={index}
        >
          <S.SelectedUsername>{/* {item} */}</S.SelectedUsername>
          {/* <S.CloseSelectedUsernameButton onClick={() => handleOnClose(item)} /> */}
        </S.SelectedUsernameTile>
        {/* ))} */}
      </S.SelectedUsernamesWrapper>
      {/* )} */}
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
    </>
  );
};

export { ProfileNamesInput };
