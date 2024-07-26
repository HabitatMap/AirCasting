import React from "react";

import { ProfileNamesInput } from "./ProfileNamesInput";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";
import { TagsInput } from "./TagsInput";

const DesktopSessionFilters = () => {
  return (
    <S.SessionFilters>
      <SessionTypeToggle />
      <ProfileNamesInput />
      <TagsInput />
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
