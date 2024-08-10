import React from "react";

import { SessionTypes } from "../../types/filters";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CrowdMapToggle } from "./CrowdmapToggle";
import { DesktopParameterFilter } from "./ParameterFilter";
import { ProfileNamesInput } from "./ProfileNamesInput";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";
import { TagsInput } from "./TagsInput";

const DesktopSessionFilters = () => {
  const { sessionType } = useMapParams();
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;

  return (
    <S.SessionFilters>
      <SessionTypeToggle />
      <DesktopParameterFilter />
      <ProfileNamesInput />
      <TagsInput />
      {!fixedSessionTypeSelected && <CrowdMapToggle />}
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
