import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus } from '../api/realtime';

interface RealtimeState {
  status: ConnectionStatus;
}

const initialState: RealtimeState = {
  status: 'connecting',
};

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setStatus } = realtimeSlice.actions;
export default realtimeSlice.reducer;
