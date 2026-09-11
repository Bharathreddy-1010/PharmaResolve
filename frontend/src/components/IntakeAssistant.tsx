import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  Paperclip,
  Send,
  User,
  RotateCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Check
} from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import {
  startAnalysis,
  updateProgress,
  finishAnalysisSuccess,
  finishAnalysisError,
  addChatMessage,
  clearChatMessages,
  setChatLoading,
} from '../store/aiSlice';
import { populateFromAi, setFormField } from '../store/complaintSlice';
import { api } from '../services/api';
import { DEMO_PRESETS } from '../utils/demoData';
import { ComplaintFormData } from '../types/complaint';

import { fastExtractComplaint } from '../utils/fastExtractor';
import { progressivelyPopulateFields } from '../utils/progressivePopulator';

export const IntakeAssistant: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [chatInput, setChatInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const formData = useAppSelector((state) => state.complaint.formData);
  const {
    isAnalyzing,
    progressPercent,
    structuredAi,
    chatMessages,
    isChatLoading,
  } = useAppSelector((state) => state.ai);

  // Auto-scroll chat feed to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Dynamically adjust textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      // Clamp between 36px (1 line) and 180px (~7 lines)
      const clampedHeight = Math.min(Math.max(scrollHeight, 36), 180);
      textarea.style.height = `${clampedHeight}px`;
    }
  }, [chatInput]);

  // Handle Enter (submit) and Shift+Enter (new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // File Upload Handler (via Paperclip or Drag-and-Drop)
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      content: `📎 Uploaded document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    dispatch(addChatMessage(userMsg));
    dispatch(startAnalysis());
    dispatch(setChatLoading(true));

    // If text-readable file, trigger instant client-side progressive filling in 0ms!
    const isTextReadable =
      file.type.startsWith('text/') ||
      ['txt', 'csv', 'eml', 'json', 'log', 'tsv'].includes(file.name.split('.').pop()?.toLowerCase() || '');

    if (isTextReadable) {
      file
        .text()
        .then((text) => {
          const instantData = fastExtractComplaint(
            text,
            `Uploaded ${file.name.split('.').pop()?.toUpperCase()}`
          );
          progressivelyPopulateFields(dispatch, instantData, undefined, 110);
        })
        .catch(() => {});
    }

    try {
      const progressTimer = setInterval(() => {
        dispatch(updateProgress(Math.min(progressPercent + 20, 85)));
      }, 400);

      const result = await api.analyzeFile(file);
      clearInterval(progressTimer);

      if (result.success && result.data) {
        dispatch(finishAnalysisSuccess({ data: result.data, stages: result.stages }));
        await progressivelyPopulateFields(dispatch, result.data, result.data.field_provenance, 70);
      } else {
        dispatch(finishAnalysisError(result.error || 'Failed to extract document'));
        dispatch(
          addChatMessage({
            id: (Date.now() + 1).toString(),
            sender: 'copilot',
            content: `Could not parse "${file.name}": ${result.error || 'File content could not be converted to structured complaint data'}. You can paste the text directly into the chat.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        );
      }
    } catch (err: any) {
      dispatch(finishAnalysisError(err.message || 'File analysis failed'));
      dispatch(
        addChatMessage({
          id: (Date.now() + 1).toString(),
          sender: 'copilot',
          content: `Analysis failed for "${file.name}". Please check the file format or try pasting the complaint details.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  // Text / Preset Analysis
  const handleAnalyzeText = async (text: string, source: string) => {
    dispatch(startAnalysis());
    dispatch(setChatLoading(true));

    // Immediately trigger instant client-side progressive population in 0ms!
    const instantData = fastExtractComplaint(text, source);
    progressivelyPopulateFields(dispatch, instantData, undefined, 110);

    try {
      const progressTimer = setInterval(() => {
        dispatch(updateProgress(Math.min(progressPercent + 20, 85)));
      }, 400);

      const result = await api.analyzeText(text, source);
      clearInterval(progressTimer);

      if (result.success && result.data) {
        dispatch(finishAnalysisSuccess({ data: result.data, stages: result.stages }));
        await progressivelyPopulateFields(dispatch, result.data, result.data.field_provenance, 70);
      } else {
        dispatch(finishAnalysisError(result.error || 'Failed to analyze text'));
      }
    } catch (err: any) {
      dispatch(finishAnalysisError(err.message || 'Text analysis failed'));
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Send Chat / Natural Language Field Updates
  const handleSendChat = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim() || isChatLoading || isAnalyzing) return;

    const lower = textToSend.toLowerCase();

    // Check if input is a full complaint intake block
    const isComplaintIntake =
      lower.includes('customer:') ||
      lower.includes('batch:') ||
      lower.includes('batch/lot') ||
      lower.includes('product:') ||
      lower.includes('complaint date:') ||
      lower.includes('intake memo') ||
      (lower.includes('fill') && lower.includes('form')) ||
      (lower.includes('log') && lower.includes('complaint')) ||
      (textToSend.length > 60 && (
        (lower.includes('batch') || lower.includes('lot') || lower.includes('b240812') || lower.includes('b1234') || lower.includes('amx-')) &&
        (lower.includes('tablet') || lower.includes('capsule') || lower.includes('box') || lower.includes('pack') || lower.includes('defect') || lower.includes('damaged') || lower.includes('broken') || lower.includes('discoloration') || lower.includes('shortage') || lower.includes('received') || lower.includes('reported'))
      ));

    // Instant client-side field updates detection for quick corrections
    let locallyUpdated = false;

    // 1. Strength / Dosage (e.g. "not 250 mg its 300 mg", "change strength to 300 mg")
    const strengthMatch =
      textToSend.match(/(?:not|instead of)\s+\d+\s*(?:mg|g|ml|mcg|iu|%)\s*(?:[,\.;]|\s+|but)*\s*(?:its|it's|it is|use|is|to|=|should be)?\s*(\d+\s*(?:mg|g|ml|mcg|iu|%))/i) ||
      textToSend.match(/(\d+\s*(?:mg|g|ml|mcg|iu|%))\s+(?:not|instead of)\s+\d+\s*(?:mg|g|ml|mcg|iu|%)/i) ||
      textToSend.match(/(?:change|update|set|correct|make)\s+(?:the\s+)?(?:product\s+)?(?:strength|dose|dosage)\s+(?:to|=|\s+)*(\d+\s*(?:mg|g|ml|mcg|iu|%))/i) ||
      textToSend.match(/(?:its|it's|it is|actually|should be)\s+(\d+\s*(?:mg|g|ml|mcg|iu|%))/i);

    if (strengthMatch) {
      dispatch(setFormField({ field: 'product_strength', value: strengthMatch[1].trim(), provenance: 'User Entered' }));
      locallyUpdated = true;
    }

    // 2. Batch (requires explicit batch/lot keyword so strength units are not misidentified)
    const batchMatch =
      textToSend.match(/(?:not|instead of)\s+(?:batch\s+|lot\s+)([A-Za-z0-9\-]+)\s*(?:[,\.;]|\s+|but)*\s*(?:its|it's|it is|use|is|to|=|should be)?\s*(?:batch\s+|lot\s+)?([A-Za-z0-9\-]+)/i) ||
      textToSend.match(/(?:change|update|set|correct)\s+(?:the\s+)?(?:batch|lot)(?:\s*(?:number|no|#))?\s+(?:to|=|\s+)*([A-Za-z0-9\-]+)/i) ||
      textToSend.match(/\b(?:batch|lot)(?:\s*(?:number|no|#))?\s*(?:is|:|to|=)\s*([A-Za-z0-9\-]+)/i);

    if (batchMatch && !strengthMatch) {
      const val = batchMatch[2] || batchMatch[1];
      if (!['NOT', 'MG', 'ML', 'G', 'THE', 'A', 'AN', 'COMPLAINT', 'PRODUCT'].includes(val.toUpperCase())) {
        dispatch(setFormField({ field: 'batch_number', value: val.trim().toUpperCase(), provenance: 'User Entered' }));
        locallyUpdated = true;
      }
    }

    // 3. Customer Name
    const customerMatch =
      textToSend.match(/(?:change|update|set|correct)\s+(?:the\s+)?customer\s+(?:name\s+)?(?:to|=|\s+)*([A-Za-z0-9\s]+?)(?:[,\.;]|$)/i) ||
      textToSend.match(/(?:customer|client)(?:\s+name)?(?:\s+is|\s*:|\s+to)\s*([A-Za-z0-9\s]+?)(?:[,\.;]|$)/i);

    if (customerMatch) {
      dispatch(setFormField({ field: 'customer_name', value: customerMatch[1].trim(), provenance: 'User Entered' }));
      locallyUpdated = true;
    }

    // 4. Quantity (requires packaging units, NOT mg/ml)
    const qtyUnits = '(?:tablets|capsules|units|bottles|boxes|packs|cartons|strips|vials|ampoules|cases|containers|syringes|blisters)';
    const qtyMatch =
      textToSend.match(new RegExp(`(?:not|instead of)\\s+\\d+[\\d,]*\\s*${qtyUnits}\\s*(?:[,\\.;]|\\s+|but)*\\s*(?:its|it's|it is|use|is|to|=|should be)?\\s*(\\d+[\\d,]*\\s*${qtyUnits})`, 'i')) ||
      textToSend.match(new RegExp(`(?:change|update|set|correct)\\s+(?:the\\s+)?quantity\\s+(?:to|=|\\s+)*(\\d+[\\d,]*\\s*${qtyUnits})`, 'i')) ||
      textToSend.match(new RegExp(`(?:quantity|qty)(?:\\s*affected)?(?:\\s+is|\\s*:|\\s+to)\\s*(\\d+[\\d,]*\\s*${qtyUnits})`, 'i'));

    if (qtyMatch && !strengthMatch) {
      dispatch(setFormField({ field: 'quantity_affected', value: qtyMatch[1].trim(), provenance: 'User Entered' }));
      locallyUpdated = true;
    }

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    dispatch(addChatMessage(userMsg));
    setChatInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }

    if (isComplaintIntake) {
      await handleAnalyzeText(textToSend.trim(), 'Chat Intake');
      return;
    }

    dispatch(setChatLoading(true));

    try {
      const complaintContext = {
        product_name: formData.product_name,
        product_strength: formData.product_strength,
        batch_number: formData.batch_number,
        customer_name: formData.customer_name,
        quantity_affected: formData.quantity_affected,
        complaint_type: formData.complaint_type,
        description: formData.description,
        risk_level: structuredAi?.risk_level || 'MEDIUM',
        risk_confidence: structuredAi?.risk_confidence || 85.0,
        risk_reasoning: structuredAi?.risk_reasoning || '',
        completeness_score: structuredAi?.completeness_score || 80.0,
        missing_information: structuredAi?.missing_information || [],
      };

      const response = await api.askCopilot(textToSend, complaintContext);
      
      // Apply server-inferred field updates to the form on the left
      if (response.field_updates) {
        Object.entries(response.field_updates).forEach(([k, v]) => {
          if (v !== undefined && v !== null && String(v).trim()) {
            dispatch(setFormField({
              field: k as keyof ComplaintFormData,
              value: String(v).trim(),
              provenance: 'User Entered'
            }));
          }
        });
      }

      dispatch(
        addChatMessage({
          id: (Date.now() + 1).toString(),
          sender: 'copilot',
          content: response.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          references: response.references,
          suggested_followups: response.suggested_followups,
        })
      );
    } catch (err) {
      dispatch(
        addChatMessage({
          id: (Date.now() + 1).toString(),
          sender: 'copilot',
          content: locallyUpdated
            ? 'Updated the complaint form field. Let me know if you need other adjustments.'
            : 'Unable to connect to Copilot reasoning service. Please check network.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  // Quick Preset Trigger
  const handleLoadDemo = (presetIndex: number) => {
    const preset = DEMO_PRESETS[presetIndex];
    if (!preset) return;
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      content: `Load Demo: ${preset.title} (${preset.description})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    dispatch(addChatMessage(userMsg));
    handleAnalyzeText(preset.rawText, preset.title);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`bg-white rounded-xl border shadow-xs flex flex-col overflow-hidden h-full transition ${
        dragActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      {/* Hidden File Input for Paperclip */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.eml,.msg,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />

      {/* Header: AI QA Copilot with Live Status */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 text-sm tracking-tight">
                AI QA Copilot
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              GxP Complaint Intake & Quality Assistant
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => dispatch(clearChatMessages())}
            title="Reset Chat History"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Demo Scenarios Bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs overflow-x-auto shrink-0">
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
          Quick Demos:
        </span>
        <button
          type="button"
          onClick={() => handleLoadDemo(0)}
          className="text-[11px] px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition whitespace-nowrap shadow-2xs"
        >
          💊 Paracetamol Defect
        </button>
        <button
          type="button"
          onClick={() => handleLoadDemo(1)}
          className="text-[11px] px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition whitespace-nowrap shadow-2xs"
        >
          📦 Ibuprofen Transit Damage
        </button>
        <button
          type="button"
          onClick={() => handleLoadDemo(2)}
          className="text-[11px] px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition whitespace-nowrap shadow-2xs"
        >
          📋 Amoxicillin Shortage
        </button>
      </div>

      {/* Main Chat Message Feed */}
      <div
        ref={chatContainerRef}
        className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50/30"
      >
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 items-start ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* AI Avatar Icon beside Copilot messages */}
            {msg.sender === 'copilot' && (
              <div
                className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                title="AI QA Copilot"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`text-xs p-3.5 rounded-xl animate-in fade-in duration-100 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white max-w-[85%] shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-2xs max-w-[85%] space-y-2'
              }`}
            >
              <div
                className={`flex items-center justify-between mb-1 text-[10px] ${
                  msg.sender === 'user' ? 'text-blue-100 font-medium' : 'text-slate-400'
                }`}
              >
                <span className="font-semibold">
                  {msg.sender === 'user' ? 'You' : 'QA Copilot'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <p className="leading-relaxed whitespace-pre-wrap">
                {msg.content.replace(/\*+/g, '').trim()}
              </p>

              {/* GxP References */}
              {msg.references && msg.references.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">GxP Standards: </span>
                  {msg.references.join(', ')}
                </div>
              )}

              {/* Suggested Followup Action Chips */}
              {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div className="pt-1.5 space-y-1">
                  {msg.suggested_followups.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendChat(q)}
                      className="text-left block text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar Icon beside User messages */}
            {msg.sender === 'user' && (
              <div
                className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                title="You"
              >
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner during analysis or reasoning */}
        {(isChatLoading || isAnalyzing) && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs p-3 rounded-xl bg-white text-slate-600 border border-slate-200 shadow-2xs flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>
                {isAnalyzing ? `Extracting complaint details (${progressPercent}%)...` : 'Copilot is reasoning...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Notice Overlay */}
      {dragActive && (
        <div className="mx-4 mb-2 p-3 border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg text-center text-xs text-blue-800">
          Drop file here to upload and parse into complaint form
        </div>
      )}

      {/* Pinned Bottom Input Bar (Seamless Dynamic Auto-Expanding Size) */}
      <div className="p-3.5 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="relative flex items-center rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-2xs transition-all px-2 py-1.5 gap-1.5"
        >
          {/* Paperclip Button on the left */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach complaint document (PDF, TXT, DOCX, EML)"
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0 self-end mb-0.5"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Dynamic Auto-Expanding Textarea (Border-free, completely seamless) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isChatLoading || isAnalyzing}
            placeholder="Type a message or paste a complaint..."
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              resize: 'none',
              backgroundColor: 'transparent',
            }}
            className="flex-1 text-xs bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 shadow-none p-1.5 text-slate-800 placeholder-slate-400 resize-none leading-relaxed min-h-[36px] max-h-[180px] overflow-y-auto"
          />

          {/* Send Button on the right */}
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatLoading || isAnalyzing}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs shrink-0 self-end mb-0.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Centered Footer Text matching screenshot */}
        <div className="text-center mt-2 text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
          POWERED BY LANGGRAPH
        </div>
      </div>
    </div>
  );
};
