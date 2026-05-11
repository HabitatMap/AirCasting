import { act, renderHook, waitFor } from "@testing-library/react";

import useAutocompleteSuggestions from "../../utils/useAutocompleteSuggestions";

const fetchMock = jest.fn();
const geocoderMock = jest.fn();
const tokenInstances: object[] = [];

class MockSessionToken {
  constructor() {
    tokenInstances.push(this);
  }
}

interface MockPrediction {
  placeId: string;
  text: { text: string; matches: { startOffset: number; endOffset: number }[] };
  mainText: { text: string; matches: never[] } | null;
  secondaryText: { text: string; matches: never[] } | null;
  types: string[];
}

const makePrediction = (
  placeId: string,
  text: string,
  matches: { startOffset: number; endOffset: number }[] = []
): MockPrediction => ({
  placeId,
  text: { text, matches },
  mainText: { text, matches: [] },
  secondaryText: { text: "", matches: [] },
  types: ["locality"],
});

beforeEach(() => {
  fetchMock.mockReset();
  geocoderMock.mockReset();
  tokenInstances.length = 0;
  jest.useFakeTimers();
  (global as any).google = {
    maps: {
      Geocoder: jest.fn(() => ({ geocode: geocoderMock })),
      places: {
        AutocompleteSuggestion: { fetchAutocompleteSuggestions: fetchMock },
        AutocompleteSessionToken: MockSessionToken,
      },
    },
  };
});

afterEach(() => {
  jest.useRealTimers();
});

const flushTimers = async () => {
  await act(async () => {
    jest.runAllTimers();
  });
};

describe("useAutocompleteSuggestions", () => {
  it("starts idle with empty suggestions", () => {
    const { result } = renderHook(() => useAutocompleteSuggestions());
    expect(result.current.status).toBe("idle");
    expect(result.current.suggestions).toEqual([]);
  });

  it("returns mapped PlaceSuggestion list on success", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [
        {
          placePrediction: makePrediction("p1", "Berlin, Germany", [
            { startOffset: 0, endOffset: 4 },
          ]),
        },
        { placePrediction: makePrediction("p2", "Berlin, NJ") },
      ],
    });

    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    expect(result.current.suggestions).toEqual([
      {
        id: "p1",
        label: "Berlin, Germany",
        primary: "Berlin, Germany",
        secondary: "",
        matchRanges: [{ start: 0, end: 4 }],
      },
      {
        id: "p2",
        label: "Berlin, NJ",
        primary: "Berlin, NJ",
        secondary: "",
        matchRanges: [],
      },
    ]);
  });

  it("does not leak Google types in suggestions", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [{ placePrediction: makePrediction("p1", "Berlin") }],
    });
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    const keys = Object.keys(result.current.suggestions[0]).sort();
    expect(keys).toEqual([
      "id",
      "label",
      "matchRanges",
      "primary",
      "secondary",
    ]);
  });

  it("returns no_results status when API returns empty", async () => {
    fetchMock.mockResolvedValue({ suggestions: [] });
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("xqzpv"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("no_results"));
  });

  it("returns error status when API throws", async () => {
    fetchMock.mockRejectedValue(new Error("API down"));
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("test"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("debounces rapid input changes into single API call", async () => {
    fetchMock.mockResolvedValue({ suggestions: [] });
    const { result } = renderHook(() =>
      useAutocompleteSuggestions({ debounceMs: 200 })
    );

    act(() => result.current.setInput("B"));
    act(() => result.current.setInput("Be"));
    act(() => result.current.setInput("Ber"));
    await flushTimers();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: "Ber" })
    );
  });

  it("reuses session token across requests in same session", async () => {
    fetchMock.mockResolvedValue({ suggestions: [] });
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("B"));
    await flushTimers();
    act(() => result.current.setInput("Ber"));
    await flushTimers();

    expect(tokenInstances).toHaveLength(1);
    const firstToken = fetchMock.mock.calls[0][0].sessionToken;
    const secondToken = fetchMock.mock.calls[1][0].sessionToken;
    expect(firstToken).toBe(secondToken);
  });

  it("starts a new session token after selectSuggestion resolves", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [{ placePrediction: makePrediction("p1", "Berlin") }],
    });
    geocoderMock.mockResolvedValue({
      results: [
        {
          geometry: {
            location: { toJSON: () => ({ lat: 52.52, lng: 13.405 }) },
          },
          formatted_address: "Berlin, Germany",
          types: ["locality"],
        },
      ],
    });

    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    await act(async () => {
      await result.current.selectSuggestion("p1");
    });

    act(() => result.current.setInput("War"));
    await flushTimers();

    expect(tokenInstances).toHaveLength(2);
    const firstToken = fetchMock.mock.calls[0][0].sessionToken;
    const secondToken = fetchMock.mock.calls[1][0].sessionToken;
    expect(firstToken).not.toBe(secondToken);
  });

  it("selectSuggestion returns GeocodeResult for known id", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [{ placePrediction: makePrediction("p1", "Berlin") }],
    });
    geocoderMock.mockResolvedValue({
      results: [
        {
          geometry: {
            location: { toJSON: () => ({ lat: 52.52, lng: 13.405 }) },
          },
          formatted_address: "Berlin, Germany",
          types: ["locality"],
        },
      ],
    });

    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    let geocode: Awaited<ReturnType<typeof result.current.selectSuggestion>> =
      null;
    await act(async () => {
      geocode = await result.current.selectSuggestion("p1");
    });

    expect(geocode).toMatchObject({
      lat: 52.52,
      lng: 13.405,
      resolvedName: "Berlin, Germany",
    });
  });

  it("selectSuggestion returns null for unknown id", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [{ placePrediction: makePrediction("p1", "Berlin") }],
    });

    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    let geocode: Awaited<ReturnType<typeof result.current.selectSuggestion>> =
      null;
    await act(async () => {
      geocode = await result.current.selectSuggestion("nonexistent");
    });

    expect(geocode).toBeNull();
    expect(geocoderMock).not.toHaveBeenCalled();
  });

  it("passes locationBias to API call", async () => {
    fetchMock.mockResolvedValue({ suggestions: [] });
    const bias = {
      toJSON: () => ({}),
    } as unknown as google.maps.LatLngBounds;

    const { result } = renderHook(() =>
      useAutocompleteSuggestions({ locationBias: bias })
    );

    act(() => result.current.setInput("B"));
    await flushTimers();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ locationBias: bias })
    );
  });

  it("resets to idle on empty input", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [{ placePrediction: makePrediction("p1", "Berlin") }],
    });
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("B"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    act(() => result.current.setInput(""));

    expect(result.current.status).toBe("idle");
    expect(result.current.suggestions).toEqual([]);
  });

  it("reset() clears state and stops pending fetch", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [{ placePrediction: makePrediction("p1", "Berlin") }],
    });
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    act(() => result.current.reset());

    expect(result.current.input).toBe("");
    expect(result.current.status).toBe("idle");
    expect(result.current.suggestions).toEqual([]);
  });

  it("sets error status when google.maps.places is unavailable", async () => {
    (global as any).google = undefined;
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
