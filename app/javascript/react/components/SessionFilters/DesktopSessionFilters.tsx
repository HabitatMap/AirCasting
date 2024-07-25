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
      {/* temporary solution, ticket: Session Filter [Mobile]: Crowdmap Toggle */}
      <S.CrowdmapButton>crowdmap</S.CrowdmapButton>
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
