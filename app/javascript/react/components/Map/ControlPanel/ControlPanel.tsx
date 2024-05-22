import * as React from "react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import * as S from "./ControlPanel.style";
import { setMapConfigId, setMapTypeId } from "../../../store/mapSlice";
import { useAppDispatch } from "../../../store/hooks";
import { RootState } from "../../../store";
import { MapTypeId, ViewMode } from "../../../types/map";

const ControlPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const mapConfigId = useSelector((state: RootState) => state.map.mapConfigId);
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MAP);
  const [isTerrainChecked, setIsTerrainChecked] = useState<boolean>(false);
  const [isLabelsChecked, setIsLabelsChecked] = useState<boolean>(false);

  useEffect(() => {
    switch (mapConfigId) {
      case MapTypeId.SATELLITE:
        setViewMode(ViewMode.SATELLITE);
        setIsTerrainChecked(false);
        setIsLabelsChecked(false);
        break;
      case MapTypeId.HYBRID:
        setViewMode(ViewMode.SATELLITE);
        setIsTerrainChecked(false);
        setIsLabelsChecked(true);
        break;
      case MapTypeId.TERRAIN:
        setViewMode(ViewMode.MAP);
        setIsTerrainChecked(true);
        setIsLabelsChecked(false);
        break;
      default:
        setViewMode(ViewMode.MAP);
        setIsTerrainChecked(false);
        setIsLabelsChecked(false);
    }
  }, [mapConfigId]);

  const handleViewModeChange = (newViewMode: ViewMode) => {
    let selectedMapTypeId = MapTypeId.ROADMAP;
    switch (newViewMode) {
      case ViewMode.SATELLITE:
        selectedMapTypeId = isLabelsChecked
          ? MapTypeId.HYBRID
          : MapTypeId.SATELLITE;
        break;
      case ViewMode.MAP:
        selectedMapTypeId = isTerrainChecked
          ? MapTypeId.TERRAIN
          : MapTypeId.ROADMAP;
        break;
    }
    setViewMode(newViewMode);
    dispatch(setMapConfigId(selectedMapTypeId));
    dispatch(setMapTypeId(selectedMapTypeId));
  };

  const handleTerrainChange = (isChecked: boolean) => {
    const newMapTypeId = isChecked ? MapTypeId.TERRAIN : MapTypeId.ROADMAP;
    setIsTerrainChecked(isChecked);
    if (viewMode === ViewMode.MAP) {
      dispatch(setMapConfigId(newMapTypeId));
      dispatch(setMapTypeId(newMapTypeId));
    }
  };

  const handleLabelsChange = (isChecked: boolean) => {
    const newMapTypeId = isChecked ? MapTypeId.HYBRID : MapTypeId.SATELLITE;
    setIsLabelsChecked(isChecked);
    if (viewMode === ViewMode.SATELLITE) {
      dispatch(setMapConfigId(newMapTypeId));
      dispatch(setMapTypeId(newMapTypeId));
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
            onChange={() =>
              handleViewModeChange(
                viewMode === ViewMode.MAP ? ViewMode.SATELLITE : ViewMode.MAP
              )
            }
          />
          <S.Slider />
        </S.SwitchLabel>
        <S.Label isActive={viewMode === ViewMode.SATELLITE}>
          {t("map.satelliteLabel")}
        </S.Label>
      </S.ToggleContainer>

      {viewMode === ViewMode.MAP && (
        <S.TerrainContainer>
          <S.Label isActive={isTerrainChecked}>
            {t("map.terrainLabel")}
            <S.TerrainLabel>
              <S.TerrainCheckbox
                type="checkbox"
                checked={isTerrainChecked}
                onChange={() => handleTerrainChange(!isTerrainChecked)}
              />
              <S.RoundCheckbox />
            </S.TerrainLabel>
          </S.Label>
        </S.TerrainContainer>
      )}

      {viewMode === ViewMode.SATELLITE && (
        <S.TerrainContainer>
          <S.Label isActive={isLabelsChecked}>
            {t("map.labelsLabel")}
            <S.TerrainLabel>
              <S.TerrainCheckbox
                type="checkbox"
                checked={isLabelsChecked}
                onChange={() => handleLabelsChange(!isLabelsChecked)}
              />
              <S.RoundCheckbox />
            </S.TerrainLabel>
          </S.Label>
        </S.TerrainContainer>
      )}

      <S.SelectContainer>
        <S.Select
          value={mapConfigId}
          onChange={(e) => {
            const selectedMapTypeId = e.target.value;
            dispatch(setMapConfigId(selectedMapTypeId));
            dispatch(setMapTypeId(selectedMapTypeId));
          }}
        >
          <option value={MapTypeId.ROADMAP}>{t("map.mapViewLabel")}</option>
          <option value={MapTypeId.SATELLITE}>
            {t("map.mapSatelliteLabel")}
          </option>
          <option value={MapTypeId.HYBRID}>{t("map.mapHybridLabel")}</option>
          <option value={MapTypeId.TERRAIN}>{t("map.mapTerrainLabel")}</option>
        </S.Select>
      </S.SelectContainer>
    </S.ControlPanelContainer>
  );
};

export { ControlPanel };
