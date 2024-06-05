import { AxiosResponse } from "axios";

import { createAsyncThunk } from "@reduxjs/toolkit";

import { oldApiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/apiEndpoints";
import { MobileStream } from "../types/mobileStream";
import { getErrorMessage } from "../utils/getErrorMessage";

export const fetchMobileStreamById = createAsyncThunk<
  MobileStream,
  number,
  { rejectValue: { message: string } }
>("mobileStream/getData", async (id: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<MobileStream, Error> = await oldApiClient.get(
      API_ENDPOINTS.fetchMobileStreamById(id)
    );
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return rejectWithValue({ message });
  }
});
