import { configureStore } from '@reduxjs/toolkit';
import complaintReducer from './complaintSlice';
import aiReducer from './aiSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    ai: aiReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
