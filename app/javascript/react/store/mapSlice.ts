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
  hoverPosition: LatLngLiteral | null;
  position: LatLngLiteral;
  previousCenter: LatLngLiteral;
  previousZoom: number;
}

const initialState: MapState = {
  mapConfigId: MAP_CONFIGS[0].id,
  mapTypeId: MAP_CONFIGS[0].mapTypeId,
  mapId: MAP_ID,
  location: DEFAULT_MAP_CENTER,
  loading: true,
  hoverStreamId: null,
  hoverPosition: null,
  position: DEFAULT_MAP_CENTER,
  previousCenter: DEFAULT_MAP_CENTER,
  previousZoom: DEFAULT_ZOOM,
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
    setHoverPosition(state, action: PayloadAction<LatLngLiteral | null>) {
      state.hoverPosition = action.payload;
    },
    setPreviousCenter(state, action: PayloadAction<LatLngLiteral>) {
      state.previousCenter = action.payload;
    },
    setPreviousZoom(state, action: PayloadAction<number>) {
      state.previousZoom = action.payload;
    },
    initializeStateFromUrl(state, action: PayloadAction<Partial<MapState>>) {
      Object.assign(state, action.payload);
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
  initializeStateFromUrl,
} = mapSlice.actions;

export default mapSlice.reducer;
export const selectHoverStreamId = (state: RootState) =>
  state.map.hoverStreamId;
export const selectHoverPosition = (state: RootState) =>
  state.map.hoverPosition;
export const selectPreviousCenter = (state: RootState) =>
  state.map.previousCenter;
export const selectPreviousZoom = (state: RootState) => state.map.previousZoom;
export const selectMapTypeId = (state: RootState) => state.map.mapTypeId;
export const selectMapConfigId = (state: RootState) => state.map.mapConfigId;
