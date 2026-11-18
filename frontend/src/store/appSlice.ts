import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/client';
import type { Office, User } from '../api/types';

const OFFICE_STORAGE_KEY = 'bookroom.selectedOfficeId';

function readStoredOfficeId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(OFFICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeOfficeId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(OFFICE_STORAGE_KEY, id);
    else window.localStorage.removeItem(OFFICE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface AppState {
  currentUser: User | null;
  offices: Office[];
  selectedOfficeId: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: AppState = {
  currentUser: null,
  offices: [],
  selectedOfficeId: readStoredOfficeId(),
  status: 'idle',
  error: null,
};

export const bootstrap = createAsyncThunk(
  'app/bootstrap',
  async (_arg, { signal }) => {
    const [me, offices] = await Promise.all([
      api.getMe(signal),
      api.listOffices(signal),
    ]);
    return { me, offices: offices.items };
  },
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    selectOffice(state, action: PayloadAction<string | null>) {
      state.selectedOfficeId = action.payload;
      storeOfficeId(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(bootstrap.fulfilled, (state, action) => {
        state.status = 'ready';
        state.currentUser = action.payload.me;
        state.offices = action.payload.offices;
        if (
          state.selectedOfficeId &&
          !action.payload.offices.some((o) => o.id === state.selectedOfficeId)
        ) {
          state.selectedOfficeId = null;
          storeOfficeId(null);
        }
      })
      .addCase(bootstrap.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message ?? 'Ошибка загрузки';
      });
  },
});

export const { selectOffice } = appSlice.actions;
export default appSlice.reducer;
