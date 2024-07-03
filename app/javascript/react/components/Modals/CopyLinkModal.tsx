import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { copyCurrentURL } from "../../utils/copyCurrentUrl";

import useShortenedLink from "../../utils/urlShortenedLink";
import { ModalInput } from "./atoms/ModalInput";
import { BlueButton, FormWrapper } from "./Modals.style";

const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN || "";

export interface CopyLinkModalData {
  link: string;
}

const initialCopyLinkModalData: CopyLinkModalData = {
  link: window.location.href,
};

interface CopyLinkModalProps {
  onSubmit: (data: CopyLinkModalData) => void;
  onError: (error: Error) => void;
  link: string;
}

const CopyLinkModal: React.FC<CopyLinkModalProps> = ({ onSubmit, onError }) => {
  const focusInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation();
  const { shortenedLink, error } = useShortenedLink(
    window.location.href,
    BITLY_ACCESS_TOKEN
  );
  const [formState, setFormState] = useState<CopyLinkModalData>(
    initialCopyLinkModalData
  );

  useEffect(() => {
    if (error) {
      onError(error);
    } else {
      setFormState((prevFormData) => ({
        ...prevFormData,
        link: shortenedLink,
      }));
    }
  }, [shortenedLink, error, onError]);

  useEffect(() => {
    const shortenLink = async (url: string) => {
      try {
        const response = await axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
        );
        setFormState((prevFormData) => ({
          ...prevFormData,
          link: response.data,
        }));
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
    onSubmit(formState);
    copyCurrentURL(formState.link);
    setFormState(initialCopyLinkModalData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormWrapper>
        <ModalInput
          focusInputRef={focusInputRef}
          value={formState.link}
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
