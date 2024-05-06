import { useTranslation } from "react-i18next";
import React from "react";

import {
  PageContainer,
  ContentContainer,
  Title,
  Description,
} from "./NotFoundPage.style";

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <ContentContainer>
        <Title>{t("notFoundPage.header")}</Title>
        <Description>{t("notFoundPage.message")} </Description>
      </ContentContainer>
    </PageContainer>
  );
};

export { NotFoundPage };
