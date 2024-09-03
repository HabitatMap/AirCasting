import React from "react";

import { SessionTypes } from "../../types/filters";
import { SensorPrefix } from "../../types/sensors";
import { useMapParams } from "../../utils/mapParamsHandler";
import { CrowdMapToggle } from "./CrowdmapToggle";
import { IndoorOutdoorSwitch } from "./IndoorOutdoorSwitch";
import { DesktopParameterFilter } from "./ParameterFilter";
import { ProfileNamesInput } from "./ProfileNamesInput";
import { DesktopSensorFilter } from "./SensorFilter";
import * as S from "./SessionFilters.style";
import { SessionTypeToggle } from "./SessionTypeToggle";
import { TagsInput } from "./TagsInput";

const DesktopSessionFilters = () => {
  const { sessionType, sensorName } = useMapParams();
  const fixedSessionTypeSelected: boolean = sessionType === SessionTypes.FIXED;
  const airBeamSensorNameSelected = sensorName.startsWith(SensorPrefix.AIR);
  const govermentSensorNameSelected = sensorName.startsWith(
    SensorPrefix.GOVERNMENT
  );

  return (
    <S.SessionFilters>
      <SessionTypeToggle />
      <DesktopParameterFilter />
      <DesktopSensorFilter />
      {!govermentSensorNameSelected && (
        <>
          <ProfileNamesInput />
          <TagsInput />
        </>
      )}
      {fixedSessionTypeSelected && airBeamSensorNameSelected && (
        <IndoorOutdoorSwitch />
      )}
      {!fixedSessionTypeSelected && <CrowdMapToggle />}
    </S.SessionFilters>
  );
};

export { DesktopSessionFilters };
