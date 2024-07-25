import React from "react";
import styled from "styled-components";
import { H4 } from "../../Typography";

interface ConfirmationMessageProps {
  message: string | null;
}

const MessageContainer = styled.div`
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  max-width: 17rem;
  justify-content: center;
`;

const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
  message,
}) => {
  return (
    <MessageContainer>
      <H4>{message}</H4>
    </MessageContainer>
  );
};

export { ConfirmationMessage };
