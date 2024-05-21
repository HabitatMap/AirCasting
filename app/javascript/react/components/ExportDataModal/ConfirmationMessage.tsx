import React from "react";
import styled from "styled-components";

interface ConfirmationMessageProps {
  message: string;
}

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

export { ConfirmationMessage };
