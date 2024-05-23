import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MapState {
  mapConfigId: string;
  mapTypeId: string;
  id: string;
}

const initialState: MapState = {
  mapConfigId: 'map',
  mapTypeId: 'roadmap',
  id: '',
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
    setId(state, action: PayloadAction<string>) {
      state.id = action.payload;
    },
  },
});

export const { setMapConfigId, setMapTypeId, setId } = mapSlice.actions;

export default mapSlice.reducer;
