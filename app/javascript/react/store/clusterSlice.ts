import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ClusterState {
  clusterAverage: number | null;
  clusterSize: number | null;
  loading: boolean;
  visible: boolean;
}

const initialState: ClusterState = {
  clusterAverage: null,
  clusterSize: null,
  loading: false,
  visible: false,
};

const clusterSlice = createSlice({
  name: "cluster",
  initialState,
  reducers: {
    setAverage: (state, action: PayloadAction<number>) => {
      state.clusterAverage = action.payload;
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.clusterSize = action.payload;
    },
    setVisibility: (state, action: PayloadAction<boolean>) => {
      state.visible = action.payload;
    },
  },
});

export const { setAverage, setSize, setVisibility } = clusterSlice.actions;

export default clusterSlice.reducer;
