import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MAP_CONFIGS, MAP_ID } from "../components/Map/mapConfigs";
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "../const/coordinates";
import { LatLngLiteral } from "../types/googleMaps";
import { RootState } from "./";

interface MapState {
  mapConfigId: string;
  mapTypeId: string;
  mapId: string;
  location: LatLngLiteral;
  loading: boolean;
  hoverStreamId: number | null;
  position: LatLngLiteral;
  previousCenter: LatLngLiteral;
  previousZoom: number;
  modalHeight: number;
}

const initialState: MapState = {
  mapConfigId: MAP_CONFIGS[0].id,
  mapTypeId: MAP_CONFIGS[0].mapTypeId,
  mapId: MAP_ID,
  location: DEFAULT_MAP_CENTER,
  loading: true,
  hoverStreamId: null,
  position: DEFAULT_MAP_CENTER,
  previousCenter: DEFAULT_MAP_CENTER,
  previousZoom: DEFAULT_ZOOM,
  modalHeight: 0,
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setMapConfigId(state, action: PayloadAction<string>) {
      state.mapConfigId = action.payload;
    },
    setMapTypeId(state, action: PayloadAction<string>) {
      state.mapTypeId = action.payload;
    },
    setMapId(state, action: PayloadAction<string>) {
      state.mapId = action.payload;
    },
    setLocation(state, action: PayloadAction<LatLngLiteral>) {
      state.location = action.payload;
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
    setPreviousCenter(state, action: PayloadAction<LatLngLiteral>) {
      state.previousCenter = action.payload;
    },
    setPreviousZoom(state, action: PayloadAction<number>) {
      state.previousZoom = action.payload;
    },
    setModalHeight(state, action: PayloadAction<number>) {
      state.modalHeight = action.payload;
    },
  },
});

export const {
  setMapConfigId,
  setMapTypeId,
  setMapId,
  setLocation,
  setLoading,
  setHoverStreamId,
  setHoverPosition,
  setPreviousCenter,
  setPreviousZoom,
  setModalHeight,
} = mapSlice.actions;

export default mapSlice.reducer;

export const selectHoverStreamId = (state: RootState) =>
  state.map.hoverStreamId;
export const selectHoverPosition = (state: RootState) => state.map.position;
export const selectPreviousCenter = (state: RootState) =>
  state.map.previousCenter;
export const selectPreviousZoom = (state: RootState) => state.map.previousZoom;
export const selectModalHeight = (state: RootState) => state.map.modalHeight;
