import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import { TextInput } from "../Modals.style";

interface EmailInputProps {
  focusInputRef: React.RefObject<HTMLInputElement>;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  type: string;
}

const ModalInput: React.FC<EmailInputProps> = ({
  focusInputRef,
  value,
  onChange,
  name,
  type,
}) => {
  const { t } = useTranslation();

  return (
    <TextInput
      type={type}
      name={name}
      ref={focusInputRef}
      value={value}
      onChange={onChange}
      placeholder={t("exportDataModal.emailPlaceholder")}
    />
  );
};

const RedErrorMessage = styled.span`
  color: red;
`;

export { ModalInput, RedErrorMessage };
