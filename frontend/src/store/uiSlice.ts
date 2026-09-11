import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  currentTab: 'intake' | 'registry';
  isPasteModalOpen: boolean;
  selectedDemoId: string | null;
  notification: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}

const initialState: UiState = {
  currentTab: 'intake',
  isPasteModalOpen: false,
  selectedDemoId: null,
  notification: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentTab: (state, action: PayloadAction<'intake' | 'registry'>) => {
      state.currentTab = action.payload;
    },
    setPasteModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isPasteModalOpen = action.payload;
    },
    setSelectedDemoId: (state, action: PayloadAction<string | null>) => {
      state.selectedDemoId = action.payload;
    },
    setNotification: (
      state,
      action: PayloadAction<{ type: 'success' | 'error' | 'info'; message: string } | null>
    ) => {
      state.notification = action.payload;
    },
  },
});

export const {
  setCurrentTab,
  setPasteModalOpen,
  setSelectedDemoId,
  setNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
