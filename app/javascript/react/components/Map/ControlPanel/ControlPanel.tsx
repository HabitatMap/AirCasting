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
    switch (mapConfigId) {
      case MapTypeId.SATELLITE:
        setViewMode(ViewMode.SATELLITE);
        setIsTerrainChecked(false);
        break;
      case MapTypeId.TERRAIN:
        setViewMode(ViewMode.TERRAIN);
        setIsTerrainChecked(true);
        break;
      default:
        setViewMode(ViewMode.MAP);
        setIsTerrainChecked(false);
    }
  }, [mapConfigId]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMapTypeId = e.target.value;
    const newViewMode =
      selectedMapTypeId === MapTypeId.TERRAIN
        ? ViewMode.MAP
        : ViewMode.SATELLITE;
    const newIsTerrainChecked = selectedMapTypeId === MapTypeId.TERRAIN;

    setViewMode(newViewMode);
    setIsTerrainChecked(newIsTerrainChecked);
    dispatch(setMapConfigId(selectedMapTypeId));
    dispatch(setMapTypeId(selectedMapTypeId));
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
              handleSelectChange({
                target: {
                  value:
                    viewMode === ViewMode.MAP
                      ? MapTypeId.SATELLITE
                      : MapTypeId.ROADMAP,
                },
              } as any)
            }
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
                onChange={() =>
                  handleSelectChange({
                    target: {
                      value: isTerrainChecked
                        ? MapTypeId.ROADMAP
                        : MapTypeId.TERRAIN,
                    },
                  } as any)
                }
                checked={isTerrainChecked}
              />
              <S.RoundCheckbox />
            </S.TerrainLabel>
          </S.Label>
        </S.TerrainContainer>
      )}

      <S.SelectContainer>
        <S.Select value={mapConfigId} onChange={handleSelectChange}>
          <option value={MapTypeId.ROADMAP}>{t("map.mapViewLabel")}</option>
          <option value={MapTypeId.SATELLITE}>
            {t("map.mapSatelliteLabel")}
          </option>
          <option value={MapTypeId.TERRAIN}>{t("map.mapTerrainLabel")}</option>
        </S.Select>
      </S.SelectContainer>
    </S.ControlPanelContainer>
  );
};

export { ControlPanel };
