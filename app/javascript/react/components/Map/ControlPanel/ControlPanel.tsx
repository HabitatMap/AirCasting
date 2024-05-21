import * as React from "react";
import * as S from "./ControlPanel.style";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { setMapConfigId, setMapTypeId } from "../../../store/mapSlice";
import { useAppDispatch } from "../../../store/hooks";
import { RootState } from "../../../store";
import { MapTypeId, ViewMode } from "../../../types/map";
import { useTranslation } from "react-i18next";

const ControlPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const mapConfigId = useSelector((state: RootState) => state.map.mapConfigId);

  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MAP);

  useEffect(() => {
    if (mapConfigId === MapTypeId.SATELLITE) {
      setViewMode(ViewMode.SATELLITE);
    } else if (mapConfigId === MapTypeId.TERRAIN) {
      setViewMode(ViewMode.TERRAIN);
    } else {
      setViewMode(ViewMode.MAP);
    }
  }, [mapConfigId]);

  const toggleViewMode = () => {
    const newMode =
      viewMode === ViewMode.MAP ? ViewMode.SATELLITE : ViewMode.MAP;
    const newMapConfigId =
      newMode === ViewMode.MAP ? MapTypeId.ROADMAP : MapTypeId.SATELLITE;
    setViewMode(newMode);
    dispatch(setMapConfigId(newMapConfigId));
    dispatch(setMapTypeId(newMapConfigId));
  };

  const toggleTerrainMode = () => {
    const newMapConfigId =
      viewMode === ViewMode.TERRAIN ? MapTypeId.ROADMAP : MapTypeId.TERRAIN;
    setViewMode(
      viewMode === ViewMode.TERRAIN ? ViewMode.MAP : ViewMode.TERRAIN
    );
    dispatch(setMapConfigId(newMapConfigId));
    dispatch(setMapTypeId(newMapConfigId));
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

      {viewMode === ViewMode.MAP && (
        <S.TerrainContainer>
          <S.Label isActive={(viewMode as ViewMode) === ViewMode.TERRAIN}>
            {t("map.terrainLabel")}
            <S.TerrainLabel>
              <S.TerrainCheckbox
                type="checkbox"
                onChange={toggleTerrainMode}
                checked={(viewMode as ViewMode) === ViewMode.TERRAIN}
              />
              <S.RoundCheckbox />
            </S.TerrainLabel>
          </S.Label>
        </S.TerrainContainer>
      )}
    </S.ControlPanelsContainer>
  );
};

export { ControlPanel };
