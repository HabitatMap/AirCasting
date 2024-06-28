import React from "react";
import styled from "styled-components";

interface ConfirmationMessageProps {
  message: string;
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
      <h2>{message}</h2>
    </MessageContainer>
  );
};

export { ConfirmationMessage };
