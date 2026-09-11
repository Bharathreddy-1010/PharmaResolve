import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProcessingStage, StructuredComplaintAI, ChatMessage } from '../types/ai';

interface AiState {
  isAnalyzing: boolean;
  progressPercent: number;
  stages: ProcessingStage[];
  structuredAi: StructuredComplaintAI | null;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  analysisError: string | null;
  activeExtractingField: string | null;
  recentlyFilledFields: string[];
}

const initialStages: ProcessingStage[] = [
  { id: 'doc_received', title: 'Document received', status: 'pending' },
  { id: 'extract_info', title: 'Extracting complaint information', status: 'pending' },
  { id: 'id_product_batch', title: 'Identifying product and batch', status: 'pending' },
  { id: 'check_completeness', title: 'Checking complaint completeness', status: 'pending' },
  { id: 'risk_assessment', title: 'Performing AI risk assessment', status: 'pending' },
  { id: 'prep_record', title: 'Preparing complaint record', status: 'pending' },
];

const initialState: AiState = {
  isAnalyzing: false,
  progressPercent: 0,
  stages: initialStages,
  structuredAi: null,
  chatMessages: [
    {
      id: 'welcome',
      sender: 'copilot',
      content: 'Welcome to PharmaQMS Copilot! Attach a complaint document (PDF, TXT, DOCX) via the 📎 icon below, or type/paste details to auto-fill the form. You can also ask compliance questions or make corrections anytime.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ],
  isChatLoading: false,
  analysisError: null,
  activeExtractingField: null,
  recentlyFilledFields: [],
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    startAnalysis: (state) => {
      state.isAnalyzing = true;
      state.progressPercent = 15;
      state.analysisError = null;
      state.stages = [
        { id: 'doc_received', title: 'Document received', status: 'in_progress', details: 'Ingesting payload...' },
        { id: 'extract_info', title: 'Extracting complaint information', status: 'pending' },
        { id: 'id_product_batch', title: 'Identifying product and batch', status: 'pending' },
        { id: 'check_completeness', title: 'Checking complaint completeness', status: 'pending' },
        { id: 'risk_assessment', title: 'Performing AI risk assessment', status: 'pending' },
        { id: 'prep_record', title: 'Preparing complaint record', status: 'pending' },
      ];
    },
    updateProgress: (state, action: PayloadAction<number>) => {
      state.progressPercent = action.payload;
    },
    updateStages: (state, action: PayloadAction<ProcessingStage[]>) => {
      state.stages = action.payload;
    },
    finishAnalysisSuccess: (
      state,
      action: PayloadAction<{ data: StructuredComplaintAI; stages: ProcessingStage[] }>
    ) => {
      state.isAnalyzing = false;
      state.progressPercent = 100;
      state.structuredAi = action.payload.data;
      state.stages = action.payload.stages.map((st) => ({
        ...st,
        status: 'completed' as const,
      }));
      state.analysisError = null;

      // Add a concise system message in the Copilot chat
      const risk = action.payload.data.risk_level;
      const confidence = action.payload.data.risk_confidence;
      const dupNote = action.payload.data.duplicate_found
        ? ` ⚠️ Possible duplicate detected: ${action.payload.data.duplicate_notes || 'Matching batch in database.'}`
        : '';

      state.chatMessages.push({
        id: Date.now().toString(),
        sender: 'copilot',
        content: `Extracted complaint for ${action.payload.data.product_name || 'Product'} (${action.payload.data.product_strength || ''}, Batch ${action.payload.data.batch_number || ''}). All fields on the left have been populated.${dupNote}\n\nICH Q9 Risk: ${risk} (${confidence}% confidence). ${action.payload.data.risk_reasoning || ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        references: ['FDA 21 CFR 211.198', 'ICH Q9 Quality Risk Management', 'SOP-QA-104'],
        suggested_followups: [
          'What retain sample testing is required?',
          'What are the mandatory reporting deadlines?',
          'Should we initiate CAPA for this batch?'
        ]
      });
    },
    finishAnalysisError: (state, action: PayloadAction<string>) => {
      state.isAnalyzing = false;
      state.progressPercent = 0;
      state.analysisError = action.payload;
      state.stages = state.stages.map((st) =>
        st.status === 'in_progress' ? { ...st, status: 'failed' as const, details: action.payload } : st
      );
    },
    resetAiState: (state) => {
      state.isAnalyzing = false;
      state.progressPercent = 0;
      state.stages = initialStages;
      state.structuredAi = null;
      state.analysisError = null;
      state.activeExtractingField = null;
      state.recentlyFilledFields = [];
    },
    setActiveExtractingField: (state, action: PayloadAction<string | null>) => {
      state.activeExtractingField = action.payload;
    },
    addRecentlyFilledField: (state, action: PayloadAction<string>) => {
      if (!state.recentlyFilledFields.includes(action.payload)) {
        state.recentlyFilledFields.push(action.payload);
      }
    },
    clearRecentlyFilledFields: (state) => {
      state.recentlyFilledFields = [];
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatMessages.push(action.payload);
    },
    clearChatMessages: (state) => {
      state.chatMessages = [
        {
          id: 'welcome',
          sender: 'copilot',
          content: 'Welcome to PharmaQMS Copilot! Attach a complaint document (PDF, TXT, DOCX) via the 📎 icon below, or type/paste details to auto-fill the form. You can also ask compliance questions or make corrections anytime.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];
    },
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.isChatLoading = action.payload;
    },
  },
});

export const {
  startAnalysis,
  updateProgress,
  updateStages,
  finishAnalysisSuccess,
  finishAnalysisError,
  resetAiState,
  setActiveExtractingField,
  addRecentlyFilledField,
  clearRecentlyFilledFields,
  addChatMessage,
  clearChatMessages,
  setChatLoading,
} = aiSlice.actions;

export default aiSlice.reducer;
