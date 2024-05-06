import { useTranslation } from "react-i18next";
import React from "react";
import {
  NotFoundContainer,
  NotFoundContent,
  Title,
  Description,
} from "./NotFoundPage.style";

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <NotFoundContainer>
      <NotFoundContent>
        <Title>{t("notFoundPage.header")}</Title>
        <Description>{t("notFoundPage.message")} </Description>
      </NotFoundContent>
    </NotFoundContainer>
  );
};

export { NotFoundPage };
