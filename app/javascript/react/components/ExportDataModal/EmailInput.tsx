import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import { TextInput } from "../Modal/Modal.style";

interface EmailInputProps {
  focusInputRef: React.RefObject<HTMLInputElement>;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmailInput: React.FC<EmailInputProps> = ({
  focusInputRef,
  value,
  onChange,
}) => {
  const { t } = useTranslation(); // Move useTranslation inside the component

  return (
    <TextInput
      type="email"
      name="email"
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

export { EmailInput, RedErrorMessage };
