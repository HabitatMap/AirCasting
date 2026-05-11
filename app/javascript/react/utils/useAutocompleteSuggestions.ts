import { useCallback, useEffect, useRef, useState } from "react";

export interface AutocompleteSuggestionItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  matches: google.maps.places.StringRange[];
  prediction: google.maps.places.PlacePrediction;
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
  suggestions: AutocompleteSuggestionItem[];
  status: AutocompleteStatus;
  reset: () => void;
  consumeSessionToken: () => void;
  getSessionToken: () => google.maps.places.AutocompleteSessionToken | null;
}

const DEFAULT_DEBOUNCE_MS = 200;

const useAutocompleteSuggestions = (
  options: UseAutocompleteSuggestionsOptions = {}
): UseAutocompleteSuggestionsReturn => {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, locationBias = null } = options;

  const [input, setInputState] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionItem[]>(
    []
  );
  const [status, setStatus] = useState<AutocompleteStatus>("idle");

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const locationBiasRef = useRef(locationBias);

  useEffect(() => {
    locationBiasRef.current = locationBias;
  }, [locationBias]);

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

  const consumeSessionToken = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const getSessionToken = useCallback(() => sessionTokenRef.current, []);

  const reset = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setInputState("");
    setSuggestions([]);
    setStatus("idle");
  }, []);

  const setInput = useCallback((value: string) => {
    setInputState(value);
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = input.trim();
    if (!trimmed) {
      setSuggestions([]);
      setStatus("idle");
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

        const mapped: AutocompleteSuggestionItem[] = rawSuggestions
          .map((s) => s.placePrediction)
          .filter(
            (p): p is google.maps.places.PlacePrediction => p !== null
          )
          .map((p) => ({
            placeId: p.placeId,
            description: p.text.text,
            mainText: p.mainText?.text ?? p.text.text,
            secondaryText: p.secondaryText?.text ?? "",
            matches: p.text.matches,
            prediction: p,
          }));

        setSuggestions(mapped);
        setStatus(mapped.length === 0 ? "no_results" : "ok");
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setStatus("error");
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
    consumeSessionToken,
    getSessionToken,
  };
};

export default useAutocompleteSuggestions;
