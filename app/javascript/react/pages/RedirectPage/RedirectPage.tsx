import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as S from "./RedirectPage.style";
import Title from "./Title";

interface RedirectPageProps {
  children: React.ReactNode;
}

const MAP_PAGE_PATH = "/";

const RedirectPage: React.FC<RedirectPageProps> = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // navigate(MAP_PAGE_PATH);
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      {children}

      <S.PageContainer>
        <S.ContentContainer>
          <Title />
          <S.Description>{t("redirectPage.message")} </S.Description>
          <S.BlueButton onClick={() => navigate(MAP_PAGE_PATH)}>
            {t("redirectPage.button")}
          </S.BlueButton>
        </S.ContentContainer>
      </S.PageContainer>
    </>
  );
};

export { RedirectPage };
