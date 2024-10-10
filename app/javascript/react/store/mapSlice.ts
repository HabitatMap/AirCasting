import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MAP_ID } from "../components/Map/mapConfigs";
import { DEFAULT_MAP_CENTER } from "../const/coordinates";
import { LatLngLiteral } from "../types/googleMaps";
import { RootState } from "./";

interface MapState {
  fetchingData: boolean;
  hoverStreamId: number | null;
  mapId: string;
  position: LatLngLiteral;
  sessionsListExpanded: boolean;
}

export const initialState: MapState = {
  fetchingData: true,
  hoverStreamId: null,
  mapId: MAP_ID,
  position: DEFAULT_MAP_CENTER,
  sessionsListExpanded: true,
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setFetchingData(state, action: PayloadAction<boolean>) {
      state.fetchingData = action.payload;
    },
    setHoverStreamId(state, action: PayloadAction<number | null>) {
      state.hoverStreamId = action.payload;
    },
    setHoverPosition(state, action: PayloadAction<LatLngLiteral>) {
      state.position = action.payload;
    },
    setMapId(state, action: PayloadAction<string>) {
      state.mapId = action.payload;
    },
    setSessionsListExpanded(state, action: PayloadAction<boolean>) {
      state.sessionsListExpanded = action.payload;
    },
  },
});

export const {
  setFetchingData,
  setHoverPosition,
  setHoverStreamId,
  setMapId,
  setSessionsListExpanded,
} = mapSlice.actions;

export default mapSlice.reducer;

export const selectFetchingData = (state: RootState) => state.map.fetchingData;
export const selectHoverStreamId = (state: RootState) =>
  state.map.hoverStreamId;
export const selectHoverPosition = (state: RootState) => state.map.position;
export const selectSessionsListExpanded = (state: RootState) =>
  state.map.sessionsListExpanded;
