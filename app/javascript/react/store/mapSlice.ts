import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MAP_CONFIGS } from "../components/Map/mapConfigs";
import { DEFAULT_MAP_CENTER } from "../const/coordinates";
import { LatLngLiteral } from "../types/googleMaps";

interface MapState {
  mapConfigId: string;
  mapTypeId: string;
  mapId: string;
  location: LatLngLiteral;
}

const initialState: MapState = {
  mapConfigId: MAP_CONFIGS[0].id,
  mapTypeId: MAP_CONFIGS[0].mapTypeId,
  mapId: "3808fe50f232092d",
  location: DEFAULT_MAP_CENTER,
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
  },
});

export const { setMapConfigId, setMapTypeId, setMapId, setLocation } =
  mapSlice.actions;

export default mapSlice.reducer;
