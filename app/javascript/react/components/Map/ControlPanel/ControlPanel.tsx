import * as React from "react";
import type { MapConfig } from "../Map";
import * as S from "./ControlPanel.style";
import { useState, useEffect } from "react";

type ControlPanelProps = {
  mapConfigs: MapConfig[];
  mapConfigId: string;
  onMapConfigIdChange: (id: string) => void;
};

enum ViewMode {
  MAP = "map",
  SATELLITE = "satellite",
  TERRAIN = "terrain",
}

const MAP_LABEL = "Map";
const SATELLITE_LABEL = "Satellite";
const TERRAIN_LABEL = "Terrain";

const ControlPanel = ({
  mapConfigs,
  mapConfigId,
  onMapConfigIdChange,
}: ControlPanelProps) => {
  const [viewMode, setViewMode] = useState(ViewMode.MAP);

  useEffect(() => {
    const mapConfig = mapConfigs.find((config) => config.id === mapConfigId);
    if (mapConfig) {
      setViewMode(
        mapConfigId === "satellite"
          ? ViewMode.SATELLITE
          : mapConfigId === "terrain"
          ? ViewMode.TERRAIN
          : ViewMode.MAP
      );
    }
  }, [mapConfigId, mapConfigs]);

  const toggleViewMode = () => {
    if (viewMode === ViewMode.TERRAIN) {
      setViewMode(ViewMode.MAP);
      onMapConfigIdChange("map");
    } else {
      const newMode =
        viewMode === ViewMode.MAP ? ViewMode.SATELLITE : ViewMode.MAP;
      const newMapConfigId = newMode === ViewMode.MAP ? "map" : "satellite";
      setViewMode(newMode);
      onMapConfigIdChange(newMapConfigId);
    }
  };

  const toggleTerrainMode = () => {
    if (viewMode === ViewMode.TERRAIN) {
      setViewMode(ViewMode.MAP);
      onMapConfigIdChange("map");
    } else {
      setViewMode(ViewMode.TERRAIN);
      onMapConfigIdChange("terrain");
    }
  };

  return (
    <S.ControlPanelsContainer>
      <S.ToggleContainer>
        <S.Label isActive={viewMode === ViewMode.MAP}>{MAP_LABEL}</S.Label>
        <S.SwitchLabel>
          <S.SwitchInput
            type="checkbox"
            checked={viewMode === ViewMode.SATELLITE}
            onChange={toggleViewMode}
          />
          <S.Slider />
        </S.SwitchLabel>
        <S.Label isActive={viewMode === ViewMode.SATELLITE}>
          {SATELLITE_LABEL}
        </S.Label>
      </S.ToggleContainer>

      <S.TerrainContainer>
        <S.Label isActive={viewMode === ViewMode.TERRAIN}>
          {TERRAIN_LABEL}
          <S.TerrainLabel>
            <S.TerrainCheckbox
              type="checkbox"
              onChange={toggleTerrainMode}
              checked={viewMode === ViewMode.TERRAIN}
            />
            <S.RoundCheckbox />
          </S.TerrainLabel>
        </S.Label>
      </S.TerrainContainer>
    </S.ControlPanelsContainer>
  );
};

export { ControlPanel };
