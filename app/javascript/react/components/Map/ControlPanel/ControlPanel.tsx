import * as React from "react";
import * as S from "./ControlPanel.style";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { setMapConfigId, setMapTypeId } from "../../../store/mapSlice";
import { useAppDispatch } from "../../../store/hooks";
import { RootState } from "../../../store";
import { ViewMode } from "../../../types/map";
import { useTranslation } from "react-i18next";

const ControlPanel = () => {
  const dispatch = useAppDispatch();
  const mapConfigId = useSelector((state: RootState) => state.map.mapConfigId);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MAP);
  const { t } = useTranslation();

  useEffect(() => {
    setViewMode(
      mapConfigId === "satellite"
        ? ViewMode.SATELLITE
        : mapConfigId === "terrain"
        ? ViewMode.TERRAIN
        : ViewMode.MAP
    );
  }, [mapConfigId]);

  const toggleViewMode = () => {
    const newMode =
      viewMode === ViewMode.MAP ? ViewMode.SATELLITE : ViewMode.MAP;
    const newMapConfigId = newMode === ViewMode.MAP ? "map" : "satellite";
    setViewMode(newMode);
    dispatch(setMapConfigId(newMapConfigId));
    dispatch(setMapTypeId(newMode === ViewMode.MAP ? "roadmap" : "satellite"));
  };

  const toggleTerrainMode = () => {
    const newMapConfigId = viewMode === ViewMode.TERRAIN ? "map" : "terrain";
    setViewMode(ViewMode.TERRAIN);
    dispatch(setMapConfigId(newMapConfigId));
    dispatch(
      setMapTypeId(newMapConfigId === "terrain" ? "terrain" : "roadmap")
    );
  };

  return (
    <S.ControlPanelsContainer>
      <S.ToggleContainer>
        <S.Label isActive={viewMode === ViewMode.MAP}>
          {t("map.mapLabel")}
        </S.Label>
        <S.SwitchLabel>
          <S.SwitchInput
            type="checkbox"
            checked={viewMode === ViewMode.SATELLITE}
            onChange={toggleViewMode}
          />
          <S.Slider />
        </S.SwitchLabel>
        <S.Label isActive={viewMode === ViewMode.SATELLITE}>
          {t("map.satelliteLabel")}
        </S.Label>
      </S.ToggleContainer>

      <S.TerrainContainer>
        <S.Label isActive={viewMode === ViewMode.TERRAIN}>
          {t("map.terrainLabel")}
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
