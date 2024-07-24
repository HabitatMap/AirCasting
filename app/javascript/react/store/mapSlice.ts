import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MAP_CONFIGS, MAP_ID } from "../components/Map/mapConfigs";
import { DEFAULT_MAP_CENTER } from "../const/coordinates";
import { LatLngLiteral } from "../types/googleMaps";
import { RootState } from "./";

interface MapState {
  mapTypeId: string;
  mapId: string;
  loading: boolean;
  hoverStreamId: number | null;
  position: LatLngLiteral;
}

export const initialState: MapState = {
  mapTypeId: MAP_CONFIGS[0].mapTypeId,
  mapId: MAP_ID,
  loading: true,
  hoverStreamId: null,
  position: DEFAULT_MAP_CENTER,
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    initializeStateFromUrl(state, action: PayloadAction<Partial<MapState>>) {
      Object.assign(state, action.payload);
    },
    setMapTypeId(state, action: PayloadAction<string>) {
      state.mapTypeId = action.payload;
    },
    setMapId(state, action: PayloadAction<string>) {
      state.mapId = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setHoverStreamId(state, action: PayloadAction<number | null>) {
      state.hoverStreamId = action.payload;
    },
    setHoverPosition(state, action: PayloadAction<LatLngLiteral>) {
      state.position = action.payload;
    },
  },
});

export const {
  initializeStateFromUrl,
  setHoverPosition,
  setHoverStreamId,
  setLoading,
  setMapId,
  setMapTypeId,
} = mapSlice.actions;

export default mapSlice.reducer;

export const selectHoverStreamId = (state: RootState) =>
  state.map.hoverStreamId;
export const selectHoverPosition = (state: RootState) => state.map.position;
