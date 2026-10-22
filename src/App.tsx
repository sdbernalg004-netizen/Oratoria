import React, { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_PRESETS,
  DEFAULT_SOUND_SETTINGS,
  INITIAL_SPEECH_DRAFTS,
  INITIAL_SOURCE_DOCUMENTS,
} from './utils/constants';
import {
  TimerPreset,
  SoundAlertSettings,
  SpeechDraft,
  SourceDocument,
  RehearsalRecord,
  AISpeechAnalysis,
} from './types';
import { useSpeechTimer, TimerStatus } from './hooks/useSpeechTimer';
import { useVoiceRecorder, RecordedAudioResult } from './hooks/useVoiceRecorder';
import { saveAudioBlob } from './utils/audioStorage';
import { Header } from './components/Header';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControls } from './components/TimerControls';
import { VoiceRecorderWidget } from './components/VoiceRecorderWidget';
import { SpeechTeleprompter } from './components/SpeechTeleprompter';
import { FloatingAdaptableTimer } from './components/FloatingAdaptableTimer';
import { DocumentReaderView } from './components/DocumentReaderView';
import { SoundAlertsModal } from './components/SoundAlertsModal';
import { RehearsalReviewModal } from './components/RehearsalReviewModal';
import { RehearsalHistoryView } from './components/RehearsalHistoryView';
import { ShortcutsGuideModal } from './components/ShortcutsGuideModal';
import { SpeechCoachReportModal } from './components/SpeechCoachReportModal';

export default function App() {
  // Navigation / View State - Default to 'reader-floating' matching user's uploaded screenshot!
  const [currentView, setCurrentView] = useState<'reader-floating' | 'split' | 'timer-only' | 'history'>('reader-floating');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCoachReportOpen, setIsCoachReportOpen] = useState(false);

  // Sound Alert Settings
  const [soundSettings, setSoundSettings] = useState<SoundAlertSettings>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_sound_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SOUND_SETTINGS;
    } catch {
      return DEFAULT_SOUND_SETTINGS;
    }
  });

  // Source Documents / Outlines (Reading material)
  const [documents, setDocuments] = useState<SourceDocument[]>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_documents');
      return saved ? JSON.parse(saved) : INITIAL_SOURCE_DOCUMENTS;
    } catch {
      return INITIAL_SOURCE_DOCUMENTS;
    }
  });
  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    return documents[0]?.id || 'doc-wanda-sample';
  });
  const currentDoc = documents.find((d) => d.id === currentDocId) || documents[0];

  // Speeches and drafts
  const [speeches, setSpeeches] = useState<SpeechDraft[]>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_speeches');
      return saved ? JSON.parse(saved) : INITIAL_SPEECH_DRAFTS;
    } catch {
      return INITIAL_SPEECH_DRAFTS;
    }
  });
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(0);
  const currentSpeech = speeches[activeSpeechIndex] || INITIAL_SPEECH_DRAFTS[0];

  // Presets & Active Timer
  const [activePresetId, setActivePresetId] = useState<string | null>('toastmasters-7m');
  const initialSeconds = currentSpeech.targetSeconds || 420;

  // Auto-record voice with timer
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(true);

  // Rehearsal History
  const [rehearsals, setRehearsals] = useState<RehearsalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_rehearsals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stored pending review data when take finishes
  const [pendingReviewData, setPendingReviewData] = useState<{
    targetSeconds: number;
    actualSeconds: number;
    isOvertime: boolean;
    overtimeSeconds: number;
    recordedAudio: RecordedAudioResult | null;
    aiAnalysis?: AISpeechAnalysis | null;
  } | null>(null);

  // AI Coaching Analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<AISpeechAnalysis | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Voice Recorder Hook
  const {
    isRecording,
    isPaused: isRecPaused,
    micLevel,
    hasPermission,
    recordedAudio,
    errorMessage: micError,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  // Speech Timer Hook
  const {
    targetSeconds,
    remainingSeconds,
    overtimeSeconds,
    elapsedSeconds,
    status,
    progressPercent,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    addSeconds,
    setTargetSeconds,
  } = useSpeechTimer({
    initialSeconds,
    soundSettings,
    onStateChange: (newStatus: TimerStatus) => {
      if (autoRecordEnabled) {
        if (newStatus === 'running') {
          if (!isRecording) {
            startRecording();
          } else if (isRecPaused) {
            resumeRecording();
          }
        } else if (newStatus === 'paused') {
          if (isRecording) {
            pauseRecording();
          }
        }
      }
    },
  });

  // LocalStorage synchronizations
  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_sound_settings', JSON.stringify(soundSettings));
    } catch (e) {
      console.warn('Could not save sound settings', e);
    }
  }, [soundSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_documents', JSON.stringify(documents));
    } catch (e) {
      console.warn('Could not save documents', e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_speeches', JSON.stringify(speeches));
    } catch (e) {
      console.warn('Could not save speeches', e);
    }
  }, [speeches]);

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_rehearsals', JSON.stringify(rehearsals));
    } catch (e) {
      console.warn('Could not save rehearsals', e);
    }
  }, [rehearsals]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Preset Selection
  const handleSelectPreset = (preset: TimerPreset) => {
    const totalSec = preset.minutes * 60 + preset.seconds;
    setActivePresetId(preset.id);
    setTargetSeconds(totalSec);
  };

  const handleSetCustomTime = (min: number, sec: number) => {
    const totalSec = min * 60 + sec;
    setActivePresetId(null);
    setTargetSeconds(totalSec);
  };

  // Handler when a PDF or document is uploaded: reloads all sections in the Split Lectern View!
  const handlePDFExtracted = (extractedData: any, pdfUrl?: string) => {
    const newSpeechDraft: SpeechDraft = {
      id: `speech_extracted_${Date.now()}`,
      title: extractedData.title || 'Discurso desde Documento',
      topic: 'Oratoria y Presentación',
      targetSeconds: extractedData.suggestedTargetSeconds || 420,
      sections:
        extractedData.sections && extractedData.sections.length > 0
          ? extractedData.sections
          : [
              {
                id: 'sec-1',
                title: '1. Introducción y Apertura',
                estimatedMinutes: 1.5,
                notes: extractedData.fullText?.slice(0, 300) || 'Puntos clave del documento...',
              },
            ],
      fullText: extractedData.fullText || '',
      lastEdited: Date.now(),
    };

    // Add or set as active speech
    setSpeeches((prev) => [newSpeechDraft, ...prev]);
    setActiveSpeechIndex(0);

    // Update timer target seconds to match extracted suggestion
    if (extractedData.suggestedTargetSeconds) {
      setTargetSeconds(extractedData.suggestedTargetSeconds);
    }
  };

  // Finishing Rehearsal
  const handleFinishRehearsal = async () => {
    const finalElapsed = elapsedSeconds;
    const finalOvertime = overtimeSeconds;
    const isOver = status === 'overtime';

    pauseTimer();

    let recResult: RecordedAudioResult | null = recordedAudio;
    if (isRecording) {
      recResult = await stopRecording();
    }

    setPendingReviewData({
      targetSeconds,
      actualSeconds: finalElapsed,
      isOvertime: isOver,
      overtimeSeconds: finalOvertime,
      recordedAudio: recResult,
      aiAnalysis: null,
    });

    setIsReviewModalOpen(true);
  };

  // AI Speech Coaching Handler
  const handleRequestAIAnalysis = async () => {
    if (!pendingReviewData) return;

    setIsAnalyzingAI(true);
    setAiErrorMessage(null);
    setIsCoachReportOpen(true);

    try {
      let audioBase64: string | undefined = undefined;
      const mimeType = pendingReviewData.recordedAudio?.blob.type || 'audio/webm';

      if (pendingReviewData.recordedAudio?.blob) {
        const reader = new FileReader();
        audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pendingReviewData.recordedAudio!.blob);
        });
      }

      const referenceSourceText =
        currentView === 'reader-floating' && currentDoc
          ? currentDoc.content
          : currentSpeech.fullText ||
            currentSpeech.sections.map((s) => `${s.title}: ${s.notes}`).join('\n');

      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechTitle:
            currentView === 'reader-floating' && currentDoc
              ? currentDoc.title
              : currentSpeech.title,
          targetSeconds: pendingReviewData.targetSeconds,
          actualSeconds: pendingReviewData.actualSeconds,
          referenceSourceText,
          audioBase64,
          audioMimeType: mimeType,
          userNotes: '',
        }),
      });

      const data = await response.json();
      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'No se pudo obtener el análisis del entrenador.');
      }

      const completeAnalysis: AISpeechAnalysis = {
        ...data.analysis,
        analyzedAt: Date.now(),
      };

      setActiveAnalysis(completeAnalysis);
      setPendingReviewData((prev) =>
        prev ? { ...prev, aiAnalysis: completeAnalysis } : prev
      );
    } catch (err: any) {
      console.error('AI Speech Analysis Error:', err);
      setAiErrorMessage(err.message || 'Error al conectar con el entrenador de oratoria IA.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Save reviewed record into history and IndexedDB
  const handleSaveReviewedRecord = async (
    recordData: Omit<RehearsalRecord, 'id' | 'timestamp'>
  ) => {
    const id = `rehearsal_${Date.now()}`;
    let audioKey: string | undefined = undefined;

    if (pendingReviewData?.recordedAudio?.blob) {
      audioKey = `audio_${id}`;
      try {
        await saveAudioBlob(audioKey, pendingReviewData.recordedAudio.blob);
      } catch (err) {
        console.error('Failed saving audio blob to IndexedDB:', err);
      }
    }

    const newRecord: RehearsalRecord = {
      ...recordData,
      id,
      timestamp: Date.now(),
      audioStorageKey: audioKey,
      sourceTitle: currentDoc?.title,
      aiAnalysis: pendingReviewData?.aiAnalysis || activeAnalysis || undefined,
    };

    setRehearsals((prev) => [newRecord, ...prev]);
    setIsReviewModalOpen(false);
    setPendingReviewData(null);
    setActiveAnalysis(null);
    clearRecording();
    resetTimer();
  };

  const handleDiscardReview = () => {
    setIsReviewModalOpen(false);
    setPendingReviewData(null);
    setActiveAnalysis(null);
    clearRecording();
    resetTimer();
  };

  // Document management handlers
  const handleAddDocument = (newDoc: SourceDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
  };

  const handleUpdateDocument = (updatedDoc: SourceDocument) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (currentDocId === id && documents.length > 1) {
      const remaining = documents.filter((d) => d.id !== id);
      setCurrentDocId(remaining[0].id);
    }
  };

  // Speech Update
  const handleUpdateCurrentSpeech = (updated: SpeechDraft) => {
    setSpeeches((prev) =>
      prev.map((s, idx) => (idx === activeSpeechIndex ? updated : s))
    );
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetTimer();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
      } else if (e.key === 'Escape') {
        if (isSoundModalOpen) setIsSoundModalOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isReviewModalOpen) setIsReviewModalOpen(false);
        if (isCoachReportOpen) setIsCoachReportOpen(false);
        if (currentView === 'history') setCurrentView('reader-floating');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    toggleTimer,
    resetTimer,
    toggleFullscreen,
    isSoundModalOpen,
    isShortcutsOpen,
    isReviewModalOpen,
    isCoachReportOpen,
    currentView,
  ]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white relative">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSoundModal={() => setIsSoundModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        historyCount={rehearsals.length}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full relative">
        {currentView === 'history' ? (
          <RehearsalHistoryView
            records={rehearsals}
            onDeleteRecord={(id) => setRehearsals((prev) => prev.filter((r) => r.id !== id))}
            onClearAll={() => setRehearsals([])}
            onClose={() => setCurrentView('reader-floating')}
            onViewAIReport={(analysis, title) => {
              setActiveAnalysis(analysis);
              setIsCoachReportOpen(true);
            }}
          />
        ) : currentView === 'reader-floating' ? (
          /* Lector de Bosquejo / PDF con Fondo Oscuro + Cronómetro Flotante Adaptable */
          <div className="flex-1 flex flex-col relative w-full h-[calc(100vh-80px)] min-h-[550px]">
            <DocumentReaderView
              documents={documents}
              currentDocId={currentDocId}
              onSelectDocument={setCurrentDocId}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onPDFExtracted={handlePDFExtracted}
              onGoToSplitView={() => setCurrentView('split')}
            />

            {/* The Adaptable Draggable Stopwatch/Timer Widget (matching user screenshot) */}
            <FloatingAdaptableTimer
              status={status}
              remainingSeconds={remainingSeconds}
              overtimeSeconds={overtimeSeconds}
              targetSeconds={targetSeconds}
              elapsedSeconds={elapsedSeconds}
              onToggleTimer={toggleTimer}
              onResetTimer={resetTimer}
              onFinishRehearsal={handleFinishRehearsal}
              onOpenSoundModal={() => setIsSoundModalOpen(true)}
              isRecording={isRecording}
            />

            {/* Subtle floating voice recording activity pill */}
            {isRecording && (
              <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-neutral-900/90 text-neutral-200 text-xs rounded-full border border-neutral-700 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Grabando voz ({micLevel}%)</span>
              </div>
            )}
          </div>
        ) : currentView === 'timer-only' ? (
          /* Solo Cronómetro Enfocado */
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-6">
            <TimerDisplay
              remainingSeconds={remainingSeconds}
              overtimeSeconds={overtimeSeconds}
              targetSeconds={targetSeconds}
              elapsedSeconds={elapsedSeconds}
              status={status}
              progressPercent={progressPercent}
              onAddSeconds={addSeconds}
            />

            <div className="w-full mt-6">
              <TimerControls
                status={status}
                presets={DEFAULT_PRESETS}
                activePresetId={activePresetId}
                onSelectPreset={handleSelectPreset}
                onSetCustomTime={handleSetCustomTime}
                onToggleTimer={toggleTimer}
                onResetTimer={resetTimer}
                onFinishRehearsal={handleFinishRehearsal}
                isRecording={isRecording}
              />
            </div>

            <div className="w-full max-w-xl mt-6">
              <VoiceRecorderWidget
                isRecording={isRecording}
                isPaused={isRecPaused}
                micLevel={micLevel}
                hasPermission={hasPermission}
                errorMessage={micError}
                autoRecordEnabled={autoRecordEnabled}
                onToggleAutoRecord={setAutoRecordEnabled}
                recordedAudio={recordedAudio}
                onClearRecording={clearRecording}
                onManualRecordToggle={() => (isRecording ? stopRecording() : startRecording())}
                onRequestPermission={requestPermission}
              />
            </div>
          </div>
        ) : (
          /* Modo Atril Dividido (Muestra el contenido recargado del PDF/bosquejo junto al cronómetro) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-6 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 sm:p-6 justify-between">
              <div>
                <TimerDisplay
                  remainingSeconds={remainingSeconds}
                  overtimeSeconds={overtimeSeconds}
                  targetSeconds={targetSeconds}
                  elapsedSeconds={elapsedSeconds}
                  status={status}
                  progressPercent={progressPercent}
                  onAddSeconds={addSeconds}
                  isCompact={false}
                />

                <div className="mt-4">
                  <TimerControls
                    status={status}
                    presets={DEFAULT_PRESETS}
                    activePresetId={activePresetId}
                    onSelectPreset={handleSelectPreset}
                    onSetCustomTime={handleSetCustomTime}
                    onToggleTimer={toggleTimer}
                    onResetTimer={resetTimer}
                    onFinishRehearsal={handleFinishRehearsal}
                    isRecording={isRecording}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800/80">
                <VoiceRecorderWidget
                  isRecording={isRecording}
                  isPaused={isRecPaused}
                  micLevel={micLevel}
                  hasPermission={hasPermission}
                  errorMessage={micError}
                  autoRecordEnabled={autoRecordEnabled}
                  onToggleAutoRecord={setAutoRecordEnabled}
                  recordedAudio={recordedAudio}
                  onClearRecording={clearRecording}
                  onManualRecordToggle={() => (isRecording ? stopRecording() : startRecording())}
                  onRequestPermission={requestPermission}
                />
              </div>
            </div>

            {/* Panel Derecho: Contenido del archivo y Secciones Recargadas */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-[650px] lg:h-auto min-h-[500px]">
              <SpeechTeleprompter
                currentSpeech={currentSpeech}
                onUpdateSpeech={handleUpdateCurrentSpeech}
                isTimerRunning={status === 'running' || status === 'overtime'}
                onSelectTemplate={() => {}}
                activePdfUrl={currentDoc?.pdfUrl}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <SoundAlertsModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        settings={soundSettings}
        onUpdateSettings={setSoundSettings}
      />

      <ShortcutsGuideModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {pendingReviewData && (
        <RehearsalReviewModal
          isOpen={isReviewModalOpen}
          speechTitle={
            currentView === 'reader-floating' && currentDoc
              ? currentDoc.title
              : currentSpeech.title
          }
          targetSeconds={pendingReviewData.targetSeconds}
          actualSeconds={pendingReviewData.actualSeconds}
          isOvertime={pendingReviewData.isOvertime}
          overtimeSeconds={pendingReviewData.overtimeSeconds}
          recordedAudio={pendingReviewData.recordedAudio}
          onSaveRecord={handleSaveReviewedRecord}
          onDiscard={handleDiscardReview}
          onRequestAIAnalysis={handleRequestAIAnalysis}
          aiAnalysis={pendingReviewData.aiAnalysis || activeAnalysis}
          isAnalyzingAI={isAnalyzingAI}
        />
      )}

      {/* AI Speech Coach Report Modal */}
      <SpeechCoachReportModal
        isOpen={isCoachReportOpen}
        onClose={() => setIsCoachReportOpen(false)}
        analysis={activeAnalysis}
        isLoading={isAnalyzingAI}
        errorMessage={aiErrorMessage}
        onRetry={handleRequestAIAnalysis}
        speechTitle={
          currentView === 'reader-floating' && currentDoc
            ? currentDoc.title
            : currentSpeech.title
        }
      />
    </div>
  );
}
