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
  const [isTerrainChecked, setIsTerrainChecked] = useState<boolean>(false);

  useEffect(() => {
    if (mapConfigId === MapTypeId.SATELLITE) {
      setViewMode(ViewMode.SATELLITE);
      setIsTerrainChecked(false);
    } else if (mapConfigId === MapTypeId.TERRAIN) {
      setViewMode(ViewMode.TERRAIN);
      setIsTerrainChecked(true);
    } else {
      setViewMode(ViewMode.MAP);
      setIsTerrainChecked(false);
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
    setIsTerrainChecked(false); // Reset terrain when toggling view mode
  };

  const toggleTerrainMode = () => {
    const newMapConfigId = isTerrainChecked
      ? MapTypeId.ROADMAP
      : MapTypeId.TERRAIN;
    setViewMode(ViewMode.MAP); // Keep viewMode as MAP when toggling terrain
    setIsTerrainChecked(!isTerrainChecked);
    dispatch(setMapConfigId(newMapConfigId));
    dispatch(setMapTypeId(newMapConfigId));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMapTypeId = e.target.value as MapTypeId;
    if (selectedMapTypeId === MapTypeId.SATELLITE) {
      setViewMode(ViewMode.SATELLITE);
      dispatch(setMapConfigId(MapTypeId.SATELLITE));
      dispatch(setMapTypeId(MapTypeId.SATELLITE));
      setIsTerrainChecked(false);
    } else if (selectedMapTypeId === MapTypeId.TERRAIN) {
      setViewMode(ViewMode.MAP);
      setIsTerrainChecked(true);
      dispatch(setMapConfigId(MapTypeId.TERRAIN));
      dispatch(setMapTypeId(MapTypeId.TERRAIN));
    } else {
      setViewMode(ViewMode.MAP);
      setIsTerrainChecked(false);
      dispatch(setMapConfigId(MapTypeId.ROADMAP));
      dispatch(setMapTypeId(MapTypeId.ROADMAP));
    }
  };

  return (
    <S.ControlPanelContainer>
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

      {(viewMode === ViewMode.MAP || viewMode === ViewMode.TERRAIN) && (
        <S.TerrainContainer>
          <S.Label isActive={isTerrainChecked}>
            {t("map.terrainLabel")}
            <S.TerrainLabel>
              <S.TerrainCheckbox
                type="checkbox"
                onChange={toggleTerrainMode}
                checked={isTerrainChecked}
              />
              <S.RoundCheckbox />
            </S.TerrainLabel>
          </S.Label>
        </S.TerrainContainer>
      )}

      <S.SelectContainer>
        <S.Select value={mapConfigId} onChange={handleSelectChange}>
          <option value={MapTypeId.ROADMAP}>{t("map.mapLabel")}</option>
          <option value={MapTypeId.SATELLITE}>{t("map.satelliteLabel")}</option>
          <option value={MapTypeId.TERRAIN}>{t("map.terrainLabel")}</option>
        </S.Select>
      </S.SelectContainer>
    </S.ControlPanelContainer>
  );
};

export { ControlPanel };
