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
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { setUrlParams, usernames } = useMapParams();

  const profileNames = useAppSelector(selectUsernames);

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
        const decodedUsernames = decodeURIComponent(usernames);
        const selectedUsernames = decodedUsernames + ", " + selectedItem;

        const urlEncodedString = encodeURIComponent(selectedUsernames);
        setUrlParams([
          {
            key: UrlParamsTypes.usernames,
            value: urlEncodedString.toString(),
          },
        ]);

        dispatch(setLoading(true));
        reset();
      },
    });

  const decodedUsernamesArray = decodeURIComponent(usernames)
    .split(", ")
    .filter((el) => el !== "");

  const displaySearchResults = isOpen && items.length > 0;

  const handleOnClose = (itemToRemove: string) => {
    const usernamesUpdated = decodedUsernamesArray.filter(
      (el) => el !== itemToRemove
    );
    const decodedUsernamesString = usernamesUpdated.join(", ");

    setUrlParams([
      {
        key: UrlParamsTypes.usernames,
        value: decodedUsernamesString.toString(),
      },
    ]);

    dispatch(setLoading(true));
  };

  useEffect(() => {
    setItems(profileNames);
  }, [profileNames]);

  return (
    <>
      <S.SingleFilterWrapper>
        <S.Input
          placeholder="profile names"
          {...getInputProps({ value: inputValue })}
        />
        <FilterInfoPopup filterTranslationLabel="filters.profileInfo" />
      </S.SingleFilterWrapper>

      {decodedUsernamesArray && decodedUsernamesArray.length > 0 && (
        <S.SelectedUsernamesWrapper>
          {decodedUsernamesArray.map((item, index) => (
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
