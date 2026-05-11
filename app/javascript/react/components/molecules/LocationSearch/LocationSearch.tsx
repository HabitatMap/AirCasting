import { useCombobox } from "downshift";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMap } from "@vis.gl/react-google-maps";

import locationSearchIcon from "../../../assets/icons/locationSearchIcon.svg";
import { useAppDispatch } from "../../../store/hooks";
import { setFetchingData } from "../../../store/mapSlice";
import { GeocodeResult } from "../../../utils/geocodeAddress";
import { getBrowserLocation } from "../../../utils/geolocation";
import { UrlParamsTypes, useMapParams } from "../../../utils/mapParamsHandler";
import { trackRecentSearchUsed } from "../../../utils/trackRecentSearch";
import useAutocompleteSuggestions, {
  PlaceSuggestion,
} from "../../../utils/useAutocompleteSuggestions";
import useRecentSearches, {
  RecentSearch,
  SerializableBounds,
} from "../../../utils/useRecentSearches";
import * as S from "./LocationSearch.style";

interface LocationSearchProps {
  isTimelapseView: boolean;
}

type LocationItem = PlaceSuggestion | RecentSearch;

const isRecent = (item: LocationItem): item is RecentSearch =>
  "lat" in item && "lng" in item;

const renderHighlightedLabel = (
  text: string,
  ranges: { start: number; end: number }[] | undefined
): React.ReactNode => {
  if (!ranges || ranges.length === 0) return text;

  const sorted = [...ranges]
    .filter((r) => r.end > r.start && r.start < text.length)
    .sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((range, idx) => {
    const safeStart = Math.max(range.start, cursor);
    const safeEnd = Math.min(range.end, text.length);
    if (safeStart > cursor) {
      parts.push(text.slice(cursor, safeStart));
    }
    if (safeEnd > safeStart) {
      parts.push(
        <S.Highlight key={`hl-${idx}`}>
          {text.slice(safeStart, safeEnd)}
        </S.Highlight>
      );
    }
    cursor = safeEnd;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
};

const serializeBounds = (
  bounds?: google.maps.LatLngBounds
): SerializableBounds | undefined => {
  if (!bounds) return undefined;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng(),
  };
};

const boundsStableKey = (
  b: google.maps.LatLngBounds | null | undefined
): string => {
  if (!b) return "__none__";
  try {
    return JSON.stringify(b.toJSON?.() ?? null);
  } catch {
    return "__unknown__";
  }
};

const LocationSearch: React.FC<LocationSearchProps> = ({ isTimelapseView }) => {
  const dispatch = useAppDispatch();
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [inputValue, setInputValue] = useState("");
  const { t } = useTranslation();
  const map = useMap();
  const { setUrlParams } = useMapParams();
  const lastBiasKeyRef = useRef<string>("__init__");

  const [locationBias, setLocationBias] =
    useState<google.maps.places.LocationBias | null>(null);

  useEffect(() => {
    if (!map) {
      lastBiasKeyRef.current = "__init__";
      setLocationBias(null);
      return;
    }
    const syncBias = () => {
      const b = map.getBounds?.() ?? null;
      const key = boundsStableKey(b);
      if (key === lastBiasKeyRef.current) return;
      lastBiasKeyRef.current = key;
      setLocationBias(b);
    };
    syncBias();
    const listener = map.addListener("idle", syncBias);
    return () => {
      listener.remove();
      lastBiasKeyRef.current = "__init__";
    };
  }, [map]);

  const { setInput, suggestions, status, selectSuggestion } =
    useAutocompleteSuggestions({ locationBias });
  const { recents, addRecent, clearRecents } = useRecentSearches();

  const showingRecents = inputValue.trim() === "" && recents.length > 0;
  const items: LocationItem[] = showingRecents
    ? recents
    : status === "ok"
    ? suggestions
    : [];

  const liveMessage: string = (() => {
    if (showingRecents) return "";
    if (status === "loading") return t("map.statusLoading");
    if (status === "no_results") return t("map.statusNoResults");
    if (status === "error") return t("map.statusError");
    if (status === "ok" && suggestions.length > 0) {
      return t("map.statusResultsAvailable", { count: suggestions.length });
    }
    return "";
  })();

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox<LocationItem>({
    onInputValueChange: ({ inputValue: newInputValue }) => {
      setInput(newInputValue);
      setInputValue(newInputValue);
    },
    items,
    itemToString(item) {
      return item ? item.label : "";
    },
    selectedItem,
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      setSelectedItem(newSelectedItem);
      if (newSelectedItem) handleSelect(newSelectedItem);
    },
    inputValue,
  });

  const showSpinner = status === "loading" && inputValue.trim().length > 0;
  const showClearButton = inputValue.length > 0 && !showSpinner;
  const showEmptyState =
    isOpen &&
    !showingRecents &&
    status === "no_results" &&
    inputValue.trim().length > 0;
  const showErrorState = isOpen && !showingRecents && status === "error";

  const displaySearchResults =
    isOpen && (items.length > 0 || showEmptyState || showErrorState);

  const applyGeocodeResult = (result: GeocodeResult) => {
    const { lat, lng, zoom, bounds } = result;

    setUrlParams([
      {
        key: UrlParamsTypes.currentCenter,
        value: JSON.stringify({ lat, lng }),
      },
      {
        key: UrlParamsTypes.currentZoom,
        value: zoom.toString(),
      },
    ]);

    if (bounds && map) {
      map.fitBounds(bounds);
    } else {
      map?.setZoom(zoom);
      map?.panTo({ lat, lng });
    }

    setTimeout(() => {
      dispatch(setFetchingData(true));
    }, 200);
  };

  const applyRecentSearch = (recent: RecentSearch) => {
    const { lat, lng, zoom, bounds } = recent;

    setUrlParams([
      {
        key: UrlParamsTypes.currentCenter,
        value: JSON.stringify({ lat, lng }),
      },
      {
        key: UrlParamsTypes.currentZoom,
        value: zoom.toString(),
      },
    ]);

    if (bounds && map) {
      map.fitBounds(bounds);
    } else {
      map?.setZoom(zoom);
      map?.panTo({ lat, lng });
    }

    setTimeout(() => {
      dispatch(setFetchingData(true));
    }, 200);
  };

  const handleSelect = async (item: LocationItem) => {
    if (!item) return;

    if (isRecent(item)) {
      const position = recents.findIndex((r) => r.id === item.id);
      trackRecentSearchUsed({
        query: item.label,
        position: position === -1 ? 0 : position,
        totalRecents: recents.length,
      });
      applyRecentSearch(item);
      addRecent(item);
      return;
    }

    const result = await selectSuggestion(item.id);
    if (!result) return;

    applyGeocodeResult(result);

    addRecent({
      id: item.id,
      label: item.label,
      lat: result.lat,
      lng: result.lng,
      zoom: result.zoom,
      bounds: serializeBounds(result.bounds),
    });
  };

  const handleBrowserLocation = async () => {
    const location = await getBrowserLocation(map, setUrlParams);

    if (location) {
      setInputValue("");
      setInput("");
      setTimeout(() => {
        dispatch(setFetchingData(true));
      }, 200);
    } else {
      console.log(t("map.locationError"));
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    setInput("");
    setSelectedItem(null);
  };

  return (
    <S.SearchContainer $isTimelapseView={isTimelapseView}>
      <S.SearchInput
        placeholder={t("map.searchPlaceholder")}
        $displaySearchResults={displaySearchResults}
        {...getInputProps({
          "aria-label": t("map.searchInputLabel"),
        })}
      />
      {showSpinner && <S.Spinner aria-hidden="true" />}
      {showClearButton && (
        <S.ClearInputButton
          type="button"
          aria-label={t("map.clearInputAriaLabel")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearInput}
        >
          ×
        </S.ClearInputButton>
      )}
      <S.LocationSearchButton
        aria-label={t("map.browserLocationButton")}
        type="button"
        onClick={handleBrowserLocation}
      >
        <S.LocationSearchIcon
          src={locationSearchIcon}
          alt=""
          aria-hidden="true"
        />
      </S.LocationSearchButton>
      <S.LiveRegion role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </S.LiveRegion>
      <S.SuggestionsList
        $displaySearchResults={displaySearchResults}
        {...getMenuProps()}
      >
        <S.Hr $displaySearchResults={displaySearchResults} aria-hidden="true" />
        {isOpen && showingRecents && (
          <S.RecentSectionHeader>
            <S.RecentSectionLabel>
              {t("map.recentSearchesLabel")}
            </S.RecentSectionLabel>
            <S.ClearRecentsButton
              type="button"
              aria-label={t("map.clearRecentSearchesAriaLabel")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearRecents}
            >
              {t("map.clearRecentSearches")}
            </S.ClearRecentsButton>
          </S.RecentSectionHeader>
        )}
        {showEmptyState && (
          <S.EmptyState>{t("map.statusNoResults")}</S.EmptyState>
        )}
        {showErrorState && (
          <S.ErrorState>{t("map.statusError")}</S.ErrorState>
        )}
        {isOpen &&
          items.map((item, index) => {
            const labelNode =
              !showingRecents && "matchRanges" in item
                ? renderHighlightedLabel(item.label, item.matchRanges)
                : item.label;
            return (
              <S.Suggestion
                key={item.id}
                $isHighlighted={highlightedIndex === index}
                {...getItemProps({
                  item,
                  index,
                  "aria-label": showingRecents
                    ? `${item.label}, ${t("map.recentSearchesLabel").toLowerCase()}`
                    : item.label,
                })}
              >
                {labelNode}
              </S.Suggestion>
            );
          })}
      </S.SuggestionsList>
    </S.SearchContainer>
  );
};

export { LocationSearch };
