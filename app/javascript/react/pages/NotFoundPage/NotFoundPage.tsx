import React from "react";
import {
  NotFoundContainer,
  NotFoundContent,
  Title,
  Description,
} from "./NotFoundPage.style";

const NotFoundPage: React.FC = () => {
  return (
    <NotFoundContainer>
      <NotFoundContent>
        <Title>404 - Page Not Found</Title>
        <Description>
          Oops! The page you’re looking for doesn’t exist.
        </Description>
      </NotFoundContent>
    </NotFoundContainer>
  );
};

export { NotFoundPage };
