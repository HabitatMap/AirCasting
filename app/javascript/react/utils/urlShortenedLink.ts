import axios from "axios";
import { useEffect, useState } from "react";

export interface BitlyResponse {
  link: string;
}

const useShortenedLink = (url: string, accessToken: string) => {
  const [shortenedLink, setShortenedLink] = useState<string>(url);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const shortenLink = async () => {
      if (!url || !accessToken) {
        setError(new Error("URL or access token is missing."));
        return;
      }

      try {
        const response = await axios.post<BitlyResponse>(
          "https://api-ssl.bitly.com/v4/shorten",
          { long_url: url },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        setShortenedLink(response.data.link);
      } catch (error) {
        setError(error as Error);
      }
    };

    shortenLink();
  }, [url, accessToken]);

  return { shortenedLink, error };
};

export default useShortenedLink;
