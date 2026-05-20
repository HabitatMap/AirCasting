import { useCallback, useEffect, useRef, useState } from "react";

import { GeocodeResult, geocodeAddress } from "./geocodeAddress";
import {
  geocodeResultFromFetchedPlace,
  type PlaceLike,
} from "./placeSelection";

export interface PlaceSuggestion {
  id: string;
  label: string;
  matchRanges: { start: number; end: number }[];
}

export type AutocompleteStatus =
  | "idle"
  | "loading"
  | "ok"
  | "no_results"
  | "error";

interface UseAutocompleteSuggestionsOptions {
  debounceMs?: number;
  locationBias?: google.maps.places.LocationBias | null;
}

interface UseAutocompleteSuggestionsReturn {
  input: string;
  setInput: (value: string) => void;
  suggestions: PlaceSuggestion[];
  status: AutocompleteStatus;
  reset: () => void;
  selectSuggestion: (id: string) => Promise<GeocodeResult | null>;
}

const DEFAULT_DEBOUNCE_MS = 200;

const useAutocompleteSuggestions = (
  options: UseAutocompleteSuggestionsOptions = {}
): UseAutocompleteSuggestionsReturn => {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, locationBias = null } = options;

  const [input, setInputState] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<AutocompleteStatus>("idle");

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const locationBiasRef = useRef(locationBias);
  const predictionsByIdRef = useRef<
    Map<string, google.maps.places.PlacePrediction>
  >(new Map());
  const suggestionsRef = useRef<PlaceSuggestion[]>([]);

  useEffect(() => {
    locationBiasRef.current = locationBias;
  }, [locationBias]);

  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const ensureSessionToken = useCallback(() => {
    if (
      !sessionTokenRef.current &&
      typeof google !== "undefined" &&
      google.maps?.places?.AutocompleteSessionToken
    ) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const reset = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    sessionTokenRef.current = null;
    setInputState("");
    setSuggestions([]);
    setStatus("idle");
    predictionsByIdRef.current.clear();
  }, []);

  const setInput = useCallback((value: string) => {
    setInputState(value);
  }, []);

  const selectSuggestion = useCallback(
    async (id: string): Promise<GeocodeResult | null> => {
      const suggestion = suggestionsRef.current.find((s) => s.id === id);
      if (!suggestion) return null;

      const prediction = predictionsByIdRef.current.get(id);

      try {
        const predictionWithToPlace = prediction as unknown as {
          toPlace?: () => {
            fetchFields: (request: {
              fields: string[];
            }) => Promise<unknown>;
          };
        } | undefined;

        if (
          predictionWithToPlace &&
          typeof predictionWithToPlace.toPlace === "function"
        ) {
          const placeInstance = predictionWithToPlace.toPlace();
          await placeInstance.fetchFields({
            fields: [
              "formattedAddress",
              "displayName",
              "location",
              "viewport",
              "types",
              "addressComponents",
            ],
          });
          const mapped = geocodeResultFromFetchedPlace(
            placeInstance as PlaceLike,
            suggestion.label
          );
          if (mapped) {
            sessionTokenRef.current = null;
            predictionsByIdRef.current.clear();
            return mapped;
          }
        }
      } catch (err) {
        console.warn(
          "[useAutocompleteSuggestions] Place.fetchFields failed",
          err
        );
      }

      const result = await geocodeAddress(suggestion.label);

      sessionTokenRef.current = null;
      predictionsByIdRef.current.clear();

      return result;
    },
    []
  );

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = input.trim();
    if (!trimmed) {
      setSuggestions([]);
      setStatus("idle");
      predictionsByIdRef.current.clear();
      return;
    }

    if (
      typeof google === "undefined" ||
      !google.maps?.places?.AutocompleteSuggestion
    ) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    debounceTimerRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const token = ensureSessionToken();

      const request: google.maps.places.AutocompleteRequest = {
        input: trimmed,
      };
      if (token) request.sessionToken = token;
      if (locationBiasRef.current)
        request.locationBias = locationBiasRef.current;

      try {
        const { suggestions: rawSuggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        if (requestId !== requestIdRef.current) return;

        const predictions = rawSuggestions
          .map((s) => s.placePrediction)
          .filter(
            (p): p is google.maps.places.PlacePrediction => p !== null
          );

        const nextPredictionsMap = new Map<
          string,
          google.maps.places.PlacePrediction
        >();
        predictions.forEach((p) => nextPredictionsMap.set(p.placeId, p));
        predictionsByIdRef.current = nextPredictionsMap;

        const mapped: PlaceSuggestion[] = predictions.map((p) => ({
          id: p.placeId,
          label: p.text.text,
          matchRanges: (p.text.matches ?? []).map((m) => ({
            start: m.startOffset,
            end: m.endOffset,
          })),
        }));

        setSuggestions(mapped);
        setStatus(mapped.length === 0 ? "no_results" : "ok");
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setStatus("error");
        predictionsByIdRef.current.clear();
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [input, debounceMs, ensureSessionToken]);

  return {
    input,
    setInput,
    suggestions,
    status,
    reset,
    selectSuggestion,
  };
};

export default useAutocompleteSuggestions;
