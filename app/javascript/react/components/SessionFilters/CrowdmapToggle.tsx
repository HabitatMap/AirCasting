import React, { useMemo } from "react";

import { useMapParams } from "../../utils/mapParamsHandler";
import * as S from "./SessionFilters.style";

const CrowdMapToggle = () => {
  const {
    boundEast,
    boundNorth,
    boundSouth,
    boundWest,
    initialMeasurementType,
    initialUnitSymbol,
  } = useMapParams();

  const filters = useMemo(
    () =>
      JSON.stringify({
        east: boundEast,
        grid_size_x: 53,
        grid_size_y: 47,
        measurement_type: initialMeasurementType,
        north: boundNorth,
        sensor_name: "AirBeam-PM2.5",
        south: boundSouth,
        stream_ids: [2495370, 2495205, 2494971],
        tags: "",
        time_from: "1685318400",
        time_to: "1717027199",
        unit_symbol: initialUnitSymbol,
        usernames: "",
        west: boundWest,
      }),
    [
      boundEast,
      boundNorth,
      boundSouth,
      boundWest,
      initialMeasurementType,
      initialUnitSymbol,
    ]
  );

  const handleCrowdmap = () => {
    console.log(filters);
  };

  return (
    <S.SessionToggleWrapper>
      {/* temporary solution, ticket: Session Filter [Mobile]: Crowdmap Toggle */}
      <S.CrowdMapButton onClick={handleCrowdmap}>crowdmap</S.CrowdMapButton>
    </S.SessionToggleWrapper>
  );
};

export { CrowdMapToggle };
