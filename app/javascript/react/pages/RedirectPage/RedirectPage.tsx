import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  ContentContainer,
  Description,
  PageContainer,
  Title,
} from "./RedirectPage.style";

interface RedirectPageProps {
  children: React.ReactNode;
}

const MAP_PAGE_PATH = "/";

const RedirectPage: React.FC<RedirectPageProps> = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(MAP_PAGE_PATH);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      {children}

      <PageContainer>
        <ContentContainer>
          <Title>{t("redirectPage.header")}</Title>
          <Description>{t("redirectPage.message")} </Description>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export { RedirectPage };
