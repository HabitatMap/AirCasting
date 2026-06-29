import { useEffect, useState } from "react";

import { oldApiClient } from "../api/apiClient";

const useShortenedLink = (url: string) => {
  const [shortenedLink, setShortenedLink] = useState<string>(url);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const shortenLink = async () => {
      if (!url) {
        setError(new Error("URL is missing."));
        return;
      }

      try {
        const response = await oldApiClient.post("/short_url", {
          longUrl: url,
        });
        // Response keys are camelized by the apiClient interceptor.
        setShortenedLink(response.data.shortUrl);
      } catch (error) {
        setError(error as Error);
      }
    };

    shortenLink();
  }, [url]);

  return { shortenedLink, error };
};

export default useShortenedLink;
