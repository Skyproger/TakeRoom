import { configureStore } from '@reduxjs/toolkit';
import appReducer, { bootstrap } from './appSlice';
import realtimeReducer, { setStatus } from './realtimeSlice';
import { getRealtimeClient } from './realtimeClient';

export const store = configureStore({
  reducer: {
    app: appReducer,
    realtime: realtimeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Первичная загрузка данных
store.dispatch(bootstrap());

// Мостик из WS-клиента в redux-стор: статус соединения и авто-перезагрузка при data.reset
const realtime = getRealtimeClient();
realtime.onStatus((status) => {
  store.dispatch(setStatus(status));
});
realtime.subscribe((event) => {
  if (event.type === 'data.reset') {
    store.dispatch(bootstrap());
  }
});
