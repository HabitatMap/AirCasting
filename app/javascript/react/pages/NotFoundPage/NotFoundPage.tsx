import React from "react";
import { useTranslation } from "react-i18next";

import {
  ContentContainer,
  Description,
  PageContainer,
  Title,
} from "./NotFoundPage.style";

interface NotFoundPageProps {
  children: React.ReactNode;
}
const NotFoundPage: React.FC<NotFoundPageProps> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <>
      {children}

      <PageContainer>
        <ContentContainer>
          <Title>{t("notFoundPage.header")}</Title>
          <Description>{t("notFoundPage.message")} </Description>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export { NotFoundPage };
