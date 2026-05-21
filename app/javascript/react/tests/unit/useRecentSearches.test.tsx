import { act, renderHook } from "@testing-library/react";

import useRecentSearches, {
  RecentSearch,
} from "../../utils/useRecentSearches";

const STORAGE_KEY = "aircasting:recent-searches";

const makeRecent = (
  id: string,
  label = `Place ${id}`,
  lat = 50,
  lng = 20
): RecentSearch => ({
  id,
  label,
  lat,
  lng,
  zoom: 11,
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("useRecentSearches", () => {
  it("starts with empty list when localStorage is empty", () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recents).toEqual([]);
  });

  it("hydrates from localStorage on mount", () => {
    const seeded = [makeRecent("p1", "Berlin"), makeRecent("p2", "Warsaw")];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.recents).toEqual(seeded);
  });

  it("addRecent inserts new entry at the top", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => result.current.addRecent(makeRecent("p1", "Berlin")));
    act(() => result.current.addRecent(makeRecent("p2", "Warsaw")));

    expect(result.current.recents.map((r) => r.id)).toEqual(["p2", "p1"]);
  });

  it("dedupes by id, moving existing entry to the top", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => result.current.addRecent(makeRecent("p1", "Berlin")));
    act(() => result.current.addRecent(makeRecent("p2", "Warsaw")));
    act(() => result.current.addRecent(makeRecent("p1", "Berlin, Germany")));

    expect(result.current.recents).toHaveLength(2);
    expect(result.current.recents[0]).toMatchObject({
      id: "p1",
      label: "Berlin, Germany",
    });
    expect(result.current.recents[1].id).toBe("p2");
  });

  it("enforces FIFO cap (default 5)", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.addRecent(makeRecent(`p${i}`));
      }
    });

    expect(result.current.recents).toHaveLength(5);
    expect(result.current.recents.map((r) => r.id)).toEqual([
      "p6",
      "p5",
      "p4",
      "p3",
      "p2",
    ]);
  });

  it("respects custom capacity option", () => {
    const { result } = renderHook(() => useRecentSearches({ capacity: 3 }));

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.addRecent(makeRecent(`p${i}`));
      }
    });

    expect(result.current.recents).toHaveLength(3);
    expect(result.current.recents.map((r) => r.id)).toEqual(["p4", "p3", "p2"]);
  });

  it("clearRecents empties the list", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => result.current.addRecent(makeRecent("p1")));
    act(() => result.current.addRecent(makeRecent("p2")));
    act(() => result.current.clearRecents());

    expect(result.current.recents).toEqual([]);
  });

  it("persists changes to localStorage", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => result.current.addRecent(makeRecent("p1", "Berlin")));

    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]"
    );
    expect(stored).toEqual([
      expect.objectContaining({ id: "p1", label: "Berlin" }),
    ]);
  });

  it("clearRecents persists empty state", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([makeRecent("p1")])
    );
    const { result } = renderHook(() => useRecentSearches());

    act(() => result.current.clearRecents());

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("[]");
  });

  it("returns empty list when localStorage contains corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.recents).toEqual([]);
  });

  it("filters out malformed entries from stored array", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        makeRecent("p1", "Berlin"),
        { id: "p2", lat: "not-a-number" },
        null,
        makeRecent("p3", "Warsaw"),
      ])
    );

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.recents.map((r) => r.id)).toEqual(["p1", "p3"]);
  });

  it("handles non-array stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.recents).toEqual([]);
  });

  it("uses custom storageKey when provided", () => {
    const customKey = "custom:key";
    const seeded = [makeRecent("p1", "Berlin")];
    window.localStorage.setItem(customKey, JSON.stringify(seeded));

    const { result } = renderHook(() =>
      useRecentSearches({ storageKey: customKey })
    );

    expect(result.current.recents).toEqual(seeded);
  });

  it("does not throw when localStorage.setItem rejects (e.g., quota exceeded)", () => {
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    const { result } = renderHook(() => useRecentSearches());

    expect(() => {
      act(() => result.current.addRecent(makeRecent("p1")));
    }).not.toThrow();

    expect(result.current.recents).toHaveLength(1);

    setItemSpy.mockRestore();
  });
});
