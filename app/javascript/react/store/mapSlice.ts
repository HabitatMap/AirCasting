import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { MAP_CONFIGS, MAP_ID } from "../components/Map/mapConfigs";
import { DEFAULT_MAP_CENTER } from "../const/coordinates";
import { LatLngLiteral } from "../types/googleMaps";

interface MapState {
  mapConfigId: string;
  mapTypeId: string;
  mapId: string;
  location: LatLngLiteral;
  loading: boolean;
  sessionsListOpen: boolean;
  hoverStreamId: number | null;
}

const initialState: MapState = {
  mapConfigId: MAP_CONFIGS[0].id,
  mapTypeId: MAP_CONFIGS[0].mapTypeId,
  mapId: MAP_ID,
  location: DEFAULT_MAP_CENTER,
  loading: true,
  sessionsListOpen: false,
  hoverStreamId: null,
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
    setSessionsListOpen(state, action: PayloadAction<boolean>) {
      state.sessionsListOpen = action.payload;
    },
    setHoverStreamId(state, action: PayloadAction<number | null>) {
      state.hoverStreamId = action.payload;
    },
  },
});

export const {
  setMapConfigId,
  setMapTypeId,
  setMapId,
  setLocation,
  setLoading,
  setSessionsListOpen,
  setHoverStreamId,
} = mapSlice.actions;

export default mapSlice.reducer;
export const selectHoverStreamId = (state: RootState) =>
  state.map.hoverStreamId;
