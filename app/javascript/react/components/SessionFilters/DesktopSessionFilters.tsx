import React from "react";

import { CrowdMapToggle } from "./CrowdmapToggle";
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
      <CrowdMapToggle />
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
