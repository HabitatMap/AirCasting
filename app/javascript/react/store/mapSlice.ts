import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MAP_CONFIGS } from '../components/Map/mapConfigs';

interface MapState {
  mapConfigId: string;
  mapTypeId: string;
  mapId: string;
}

const initialState: MapState = {
  mapConfigId: MAP_CONFIGS[0].id,
  mapTypeId: MAP_CONFIGS[0].mapTypeId,
  mapId: MAP_CONFIGS[0].mapId || '',
};


const mapSlice = createSlice({
  name: 'map',
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

  },
});

export const { setMapConfigId, setMapTypeId, setMapId } = mapSlice.actions;

export default mapSlice.reducer;
