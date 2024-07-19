import React from "react";

import { ProfileNamesInput } from "./ProfileNamesInput";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";

const DesktopSessionFilters = () => {
  return (
    <S.SessionFilters>
      <SessionTypeToggle />
      <ProfileNamesInput />
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
