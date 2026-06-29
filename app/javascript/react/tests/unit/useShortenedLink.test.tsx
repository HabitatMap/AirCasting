import { renderHook, waitFor } from "@testing-library/react";

import { oldApiClient } from "../../api/apiClient";
import useShortenedLink from "../../utils/useShortenedLink";

jest.mock("../../api/apiClient", () => ({
  oldApiClient: { post: jest.fn() },
}));

const mockedPost = oldApiClient.post as jest.Mock;

beforeEach(() => {
  mockedPost.mockReset();
});

describe("useShortenedLink", () => {
  it("returns the shortened link from the backend", async () => {
    mockedPost.mockResolvedValue({ data: { shortUrl: "http://test.host/l/abc123" } });

    const { result } = renderHook(() =>
      useShortenedLink("http://test.host/?sessionId=1")
    );

    await waitFor(() =>
      expect(result.current.shortenedLink).toBe("http://test.host/l/abc123")
    );
    expect(result.current.error).toBeNull();
    expect(mockedPost).toHaveBeenCalledWith("/short_url", {
      longUrl: "http://test.host/?sessionId=1",
    });
  });

  it("sets an error when the request fails", async () => {
    mockedPost.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useShortenedLink("http://test.host/?sessionId=1")
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("sets an error and skips the request when url is empty", async () => {
    const { result } = renderHook(() => useShortenedLink(""));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
