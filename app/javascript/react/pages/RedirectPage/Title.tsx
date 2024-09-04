import React from "react";

import { useTranslation } from "react-i18next";
import * as S from "./RedirectPage.style";

const Loading = () => {
  const { t } = useTranslation();

  return (
    <S.Title>
      {t("redirectPage.header")}
      <S.Dot delay="0s">.</S.Dot>
      <S.Dot delay="0.2s">.</S.Dot>
      <S.Dot delay="0.4s">.</S.Dot>
    </S.Title>
  );
};

export default Loading;
