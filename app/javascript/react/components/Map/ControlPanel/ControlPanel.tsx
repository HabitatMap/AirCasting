import * as React from "react";
import type { MapConfig } from "../Map";
import * as S from "./ControlPanel.style";
import { useState } from "react";

type ControlPanelProps = {
  mapConfigs: MapConfig[];
  mapConfigId: string;
  onMapConfigIdChange: (id: string) => void;
};

const ControlPanel = ({
  mapConfigs,
  mapConfigId,
  onMapConfigIdChange,
}: ControlPanelProps) => {
  const [viewMode, setViewMode] = useState("map");
  console.log(viewMode, "viewMode");

  const toggleViewMode = () => {
    const newMode = viewMode === "map" ? "satellite" : "map";
    console.log("Updated state:", newMode);
    setViewMode(newMode);
  };

  return (
    <S.ControlPanelsContainer>
      <S.ToggleContainer>
        <S.SwitchLabel>
          <S.SwitchInput
            type="checkbox"
            checked={viewMode === "satellite"}
            onChange={toggleViewMode}
          />
          <S.Slider className="slider round"></S.Slider>
        </S.SwitchLabel>
        <span className="view-label">
          {viewMode === "map" ? "Map" : "Satellite"}
        </span>
      </S.ToggleContainer>
    </S.ControlPanelsContainer>
  );
};

export { ControlPanel };
