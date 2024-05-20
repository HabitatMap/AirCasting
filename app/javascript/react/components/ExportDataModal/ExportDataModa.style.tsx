import React from "react";
import styled from "styled-components";
import { TextInput } from "../Modal/Modal.style";

interface ConfirmationMessageProps {
  message: string;
}
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
  return (
    <TextInput
      type="email"
      name="email"
      ref={focusInputRef}
      value={value}
      onChange={onChange}
      placeholder="Enter your email"
    />
  );
};

const MessageContainer = styled.div`
  margin-top: 1rem;
  text-align: center;
`;

const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
  message,
}) => {
  return (
    <MessageContainer>
      <h2>{message}</h2>
    </MessageContainer>
  );
};

export { EmailInput, ConfirmationMessage };
