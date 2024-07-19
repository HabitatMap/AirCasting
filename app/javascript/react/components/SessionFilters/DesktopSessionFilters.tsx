import React from "react";

import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";

const DesktopSessionFilters = () => {
  return (
    <S.SessionFilters>
      <SessionTypeToggle />
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
