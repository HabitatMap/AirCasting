import React, { useEffect, useState } from "react";

import { useCombobox } from "downshift";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLoading } from "../../store/mapSlice";
import {
  fetchUsernames,
  selectUsernames,
} from "../../store/sessionFiltersSlice";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const ProfileNamesInput = () => {
  const [items, setItems] = useState<string[]>([""]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
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
      onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
        if (newSelectedItem !== null) {
          const decodedUsernames = usernames && decodeURIComponent(usernames);
          const selectedUsernames = decodedUsernames + ", " + newSelectedItem;

          const urlEncodedString = encodeURIComponent(selectedUsernames);
          setUrlParams([
            {
              key: UrlParamsTypes.usernames,
              value: urlEncodedString.toString(),
            },
          ]);

          dispatch(setLoading(true));
          reset();
          setSelectedItem("");
        }
      },
    });

  const decodedUsernamesArray =
    usernames &&
    decodeURIComponent(usernames)
      .split(", ")
      .filter((el) => el !== "");

  const displaySearchResults = isOpen && items.length > 0;

  const handleOnClose = (itemToRemove: string) => {
    const usernamesUpdated =
      decodedUsernamesArray &&
      decodedUsernamesArray.filter((el) => el !== itemToRemove);
    const decodedUsernamesString = usernamesUpdated
      ? usernamesUpdated.join(", ")
      : "";

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
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.Input
          placeholder={t("filters.profileNames")}
          {...getInputProps({ value: inputValue })}
        />
        <FilterInfoPopup filterTranslationLabel="filters.profileNamesInfo" />
      </S.SingleFilterWrapper>

      {decodedUsernamesArray && decodedUsernamesArray.length > 0 && (
        <S.SelectedItemsWrapper>
          {decodedUsernamesArray.map((item, index) => (
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

export { ProfileNamesInput };
