import { act, renderHook, waitFor } from "@testing-library/react";

import useAutocompleteSuggestions from "../../utils/useAutocompleteSuggestions";

const fetchMock = jest.fn();
const tokenInstances: object[] = [];

class MockSessionToken {
  constructor() {
    tokenInstances.push(this);
  }
}

const makePrediction = (placeId: string, text: string) => ({
  placeId,
  text: { text, matches: [{ startOffset: 0, endOffset: 1 }] },
  mainText: { text, matches: [] },
  secondaryText: { text: "", matches: [] },
  types: ["locality"],
});

beforeEach(() => {
  fetchMock.mockReset();
  tokenInstances.length = 0;
  jest.useFakeTimers();
  (global as any).google = {
    maps: {
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

  it("returns mapped suggestions on success", async () => {
    fetchMock.mockResolvedValue({
      suggestions: [
        { placePrediction: makePrediction("p1", "Berlin, Germany") },
        { placePrediction: makePrediction("p2", "Berlin, NJ") },
      ],
    });

    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("Berl"));
    await flushTimers();
    await waitFor(() => expect(result.current.status).toBe("ok"));

    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.suggestions[0]).toMatchObject({
      placeId: "p1",
      description: "Berlin, Germany",
      mainText: "Berlin, Germany",
    });
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

  it("creates new session token after consume", async () => {
    fetchMock.mockResolvedValue({ suggestions: [] });
    const { result } = renderHook(() => useAutocompleteSuggestions());

    act(() => result.current.setInput("B"));
    await flushTimers();

    act(() => result.current.consumeSessionToken());

    act(() => result.current.setInput("War"));
    await flushTimers();

    expect(tokenInstances).toHaveLength(2);
    const firstToken = fetchMock.mock.calls[0][0].sessionToken;
    const secondToken = fetchMock.mock.calls[1][0].sessionToken;
    expect(firstToken).not.toBe(secondToken);
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
