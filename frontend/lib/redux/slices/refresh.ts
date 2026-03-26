import { createSlice } from "@reduxjs/toolkit";

export interface RefreshSlice {
  nonce: number
}

const initialState: RefreshSlice = {
  nonce: 0
}

export const refreshSlice = createSlice({
  name: "refresh",
  initialState,
  reducers: {
    requestMemeRefresh: (state) => {
      state.nonce += 1
    }
  },
  extraReducers: {
    HYDRATE: (state, action) => {
      return { ...state, ...action.payload }
    }
  }
})

export const { requestMemeRefresh } = refreshSlice.actions

export default refreshSlice.reducer
