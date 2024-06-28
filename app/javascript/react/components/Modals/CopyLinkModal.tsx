import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ModalInput } from "./atoms/ModalInput";
import { BlueButton, FormWrapper } from "./Modals.style";

export interface CopyLinkModalData {
  link: string;
}

const initialCopyLinkModalData: CopyLinkModalData = {
  link: window.location.href,
};

interface CopyLinkModalProps {
  onSubmit: (data: CopyLinkModalData) => void;
  link: string;
}

const CopyLinkModal: React.FC<CopyLinkModalProps> = ({ onSubmit }) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<CopyLinkModalData>(
    initialCopyLinkModalData
  );
  const [shortLink, setShortLink] = useState<string>(
    initialCopyLinkModalData.link
  );
  const { t } = useTranslation();

  useEffect(() => {
    // Function to shorten the link using Bitly API
    const shortenLink = async (url: string) => {
      try {
        const response = await axios.post(
          "https://api-ssl.bitly.com/v4/shorten",
          { long_url: url },
          {
            headers: {
              Authorization: `Bearer 8842f7202f486a4724eb8cd36ace5e9a728ade02`,
              "Content-Type": "application/json",
            },
          }
        );
        setShortLink(response.data.link);
      } catch (error) {
        console.error("Error shortening the link: ", error);
      }
    };

    shortenLink(window.location.href);
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = event.target;
    setFormState((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    onSubmit(formState);
    navigator.clipboard
      .writeText(shortLink)
      .then(() => {
        console.log("Link copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy the link: ", err);
      });
    setFormState(initialCopyLinkModalData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormWrapper>
        <ModalInput
          focusInputRef={focusInputRef}
          value={shortLink}
          onChange={handleInputChange}
          name="link"
          type="text"
        />
        <BlueButton type="submit" aria-label={t("copyLinkModal.copyLink")}>
          {t("copyLinkModal.copyLink")}
        </BlueButton>
      </FormWrapper>
    </form>
  );
};

export { CopyLinkModal };
