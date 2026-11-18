import type { RootState } from './index';

export const selectCurrentUser = (state: RootState) => state.app.currentUser;
export const selectOffices = (state: RootState) => state.app.offices;
export const selectSelectedOfficeId = (state: RootState) => state.app.selectedOfficeId;
export const selectSelectedOffice = (state: RootState) => {
  const id = state.app.selectedOfficeId;
  if (!id) return null;
  return state.app.offices.find((office) => office.id === id) ?? null;
};
export const selectAppStatus = (state: RootState) => state.app.status;
export const selectAppError = (state: RootState) => state.app.error;
export const selectRealtimeStatus = (state: RootState) => state.realtime.status;
