import React from 'react';
import { MainLayout } from './layouts/MainLayout';
import { ComplaintIntakePage } from './pages/ComplaintIntakePage';
import { ComplaintRegistryPage } from './pages/ComplaintRegistryPage';
import { PasteModal } from './components/PasteModal';
import { useAppSelector } from './hooks/useAppSelector';
import { useAppDispatch } from './hooks/useAppDispatch';
import { startAnalysis, finishAnalysisSuccess, finishAnalysisError, updateProgress } from './store/aiSlice';
import { populateFromAi } from './store/complaintSlice';
import { api } from './services/api';

import { fastExtractComplaint } from './utils/fastExtractor';
import { progressivelyPopulateFields } from './utils/progressivePopulator';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTab = useAppSelector((state) => state.ui.currentTab);
  const progressPercent = useAppSelector((state) => state.ai.progressPercent);

  const handleAnalyzeTextFromModal = async (text: string, source: string) => {
    dispatch(startAnalysis());

    // Immediately trigger instant client-side progressive population in 0ms!
    const instantData = fastExtractComplaint(text, source);
    progressivelyPopulateFields(dispatch, instantData, undefined, 110);

    try {
      const progressTimer = setInterval(() => {
        dispatch(updateProgress(Math.min(progressPercent + 25, 85)));
      }, 350);

      const result = await api.analyzeText(text, source);
      clearInterval(progressTimer);

      if (result.success && result.data) {
        dispatch(finishAnalysisSuccess({ data: result.data, stages: result.stages }));
        await progressivelyPopulateFields(dispatch, result.data, result.data.field_provenance, 70);
      } else {
        dispatch(finishAnalysisError(result.error || 'Failed to extract text'));
      }
    } catch (err: any) {
      dispatch(finishAnalysisError(err.message || 'Analysis failed'));
    }
  };

  return (
    <MainLayout>
      {currentTab === 'intake' ? <ComplaintIntakePage /> : <ComplaintRegistryPage />}
      <PasteModal onAnalyze={handleAnalyzeTextFromModal} />
    </MainLayout>
  );
};

export default App;
