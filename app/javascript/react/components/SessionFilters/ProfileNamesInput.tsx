import { useCombobox } from "downshift";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { TRUE } from "../../const/booleans";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFetchingData } from "../../store/mapSlice";
import {
  fetchUsernames,
  selectIsUsernamesInputFetching,
  selectUsernames,
} from "../../store/sessionFiltersSlice";
import { ParamsType, SessionTypes } from "../../types/filters";
import { UrlParamsTypes, useMapParams } from "../../utils/mapParamsHandler";
import { Spinner } from "../Loader/Spinner";
import { FilterInfoPopup } from "./FilterInfoPopup";
import * as S from "./SessionFilters.style";

const ProfileNamesInput = () => {
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

  const usernamesToSelect = useAppSelector(selectUsernames);
  const isIndoorParameterInUrl = isIndoor === TRUE;
  const isUsernamesInputFetching = useAppSelector(
    selectIsUsernamesInputFetching
  );
  const selectedSessionType = sessionType || SessionTypes.FIXED;
  const preparedUnitSymbol = unitSymbol.replace(/"/g, "");
  const tagsDecoded = tags && decodeURIComponent(tags);

  const getQueryParams = (usernames: string): ParamsType => {
    return {
      tags: tagsDecoded,
      west: boundWest.toString(),
      east: boundEast.toString(),
      south: boundSouth.toString(),
      north: boundNorth.toString(),
      timeFrom: timeFrom,
      timeTo: timeTo,
      usernames: usernames,
      sensorName: sensorName,
      unitSymbol: preparedUnitSymbol,
      sessionType: selectedSessionType,
      isIndoor: isIndoor === TRUE,
      isActive: isActive,
    };
  };

  const getUsernamesToSelectFiltered = (
    usernamesToBeExcluded: "" | string[] | null
  ) => {
    return usernamesToBeExcluded
      ? usernamesToSelect.filter(
          (username) => !usernamesToBeExcluded.includes(username)
        )
      : usernamesToSelect;
  };

  const { isOpen, getMenuProps, getInputProps, getItemProps, reset } =
    useCombobox({
      items: items,
      inputValue,
      selectedItem,
      onInputValueChange: ({ inputValue }) => {
        setInputValue(inputValue);

        const usernamesToSelectFiltered = getUsernamesToSelectFiltered(
          decodedUsernamesArray
        );

        const filteredUsernames = inputValue
          ? usernamesToSelectFiltered.filter((username) =>
              username.toLowerCase().startsWith(inputValue.toLowerCase())
            )
          : decodedUsernamesArray
          ? usernamesToSelect.filter(
              (username) => !decodedUsernamesArray.includes(username)
            )
          : usernamesToSelect;
        setItems(filteredUsernames);
      },
      onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
        if (
          newSelectedItem !== null &&
          !decodedUsernamesArray?.includes(newSelectedItem)
        ) {
          const decodedUsernames = usernames && decodeURIComponent(usernames);
          const selectedUsernames = decodedUsernames + ", " + newSelectedItem;

          const urlEncodedString = encodeURIComponent(selectedUsernames);
          setFilter(UrlParamsTypes.usernames, urlEncodedString.toString());
          reset();
          setSelectedItem("");
          const usernamesToSelectFiltered = getUsernamesToSelectFiltered(
            decodedUsernamesArray
          );
          setItems(usernamesToSelectFiltered);
        }
      },
    });

  const handleOnInputClick = () => {
    const queryParams = getQueryParams(inputValue);
    dispatch(fetchUsernames(queryParams));
  };

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
    setFilter(UrlParamsTypes.usernames, decodedUsernamesString.toString());

    const usernamesToSelectFiltered =
      getUsernamesToSelectFiltered(usernamesUpdated);
    setItems(usernamesToSelectFiltered);
  };

  useEffect(() => {
    const usernamesToSelectFiltered = getUsernamesToSelectFiltered(
      decodedUsernamesArray
    );
    setItems(usernamesToSelectFiltered);
  }, [usernamesToSelect]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    } else {
      const timer = setTimeout(() => {
        dispatch(setFetchingData(true));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [usernames, dispatch]);

  return (
    <S.Wrapper>
      <S.SingleFilterWrapper>
        <S.InputWrapper>
          <S.Input
            placeholder={t("filters.profileNames")}
            {...getInputProps({
              value: inputValue,
              onClick: handleOnInputClick,
            })}
            disabled={isIndoorParameterInUrl}
          />
          {isUsernamesInputFetching && <Spinner />}
        </S.InputWrapper>
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
