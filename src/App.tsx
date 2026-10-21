import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DEFAULT_PRESETS,
  DEFAULT_SOUND_SETTINGS,
  INITIAL_SPEECH_DRAFTS,
} from './utils/constants';
import {
  TimerPreset,
  SoundAlertSettings,
  SpeechDraft,
  RehearsalRecord,
} from './types';
import { useSpeechTimer, TimerStatus } from './hooks/useSpeechTimer';
import { useVoiceRecorder, RecordedAudioResult } from './hooks/useVoiceRecorder';
import { saveAudioBlob } from './utils/audioStorage';
import { Header } from './components/Header';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControls } from './components/TimerControls';
import { VoiceRecorderWidget } from './components/VoiceRecorderWidget';
import { SpeechTeleprompter } from './components/SpeechTeleprompter';
import { SoundAlertsModal } from './components/SoundAlertsModal';
import { RehearsalReviewModal } from './components/RehearsalReviewModal';
import { RehearsalHistoryView } from './components/RehearsalHistoryView';
import { ShortcutsGuideModal } from './components/ShortcutsGuideModal';

export default function App() {
  // Navigation / View State
  const [currentView, setCurrentView] = useState<'split' | 'timer-only' | 'history'>('split');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Sound Alert Settings
  const [soundSettings, setSoundSettings] = useState<SoundAlertSettings>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_sound_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SOUND_SETTINGS;
    } catch {
      return DEFAULT_SOUND_SETTINGS;
    }
  });

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
  } | null>(null);

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
    onTimeExpired: () => {
      // Notification when time expires
    },
    onStateChange: (newStatus: TimerStatus) => {
      // Synchronize voice recorder with timer actions if auto-record is enabled
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

  // Synchronize localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_sound_settings', JSON.stringify(soundSettings));
    } catch (e) {
      console.warn('Could not save sound settings to localStorage', e);
    }
  }, [soundSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_speeches', JSON.stringify(speeches));
    } catch (e) {
      console.warn('Could not save speeches to localStorage', e);
    }
  }, [speeches]);

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_rehearsals', JSON.stringify(rehearsals));
    } catch (e) {
      console.warn('Could not save rehearsals to localStorage', e);
    }
  }, [rehearsals]);

  // Fullscreen change listener
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
    });

    setIsReviewModalOpen(true);
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
    };

    setRehearsals((prev) => [newRecord, ...prev]);
    setIsReviewModalOpen(false);
    setPendingReviewData(null);
    clearRecording();
    resetTimer();
  };

  const handleDiscardReview = () => {
    setIsReviewModalOpen(false);
    setPendingReviewData(null);
    clearRecording();
    resetTimer();
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
      // Ignore if typing in text input, textarea, or contentEditable
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
        if (currentView === 'history') setCurrentView('split');
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
    currentView,
  ]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
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
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {currentView === 'history' ? (
          <RehearsalHistoryView
            records={rehearsals}
            onDeleteRecord={(id) => setRehearsals((prev) => prev.filter((r) => r.id !== id))}
            onClearAll={() => setRehearsals([])}
            onClose={() => setCurrentView('split')}
          />
        ) : currentView === 'timer-only' ? (
          /* Solo Cronómetro / Modo Podio Enfocado */
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
          /* Modo Atril Dividido (Lectern Split View) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            {/* Left Panel: Digital Lectern Timer & Controls */}
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

              {/* Integrated Voice Recorder Widget */}
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

            {/* Right Panel: Speech Teleprompter & Lectern Notes */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-[650px] lg:h-auto min-h-[500px]">
              <SpeechTeleprompter
                currentSpeech={currentSpeech}
                onUpdateSpeech={handleUpdateCurrentSpeech}
                isTimerRunning={status === 'running' || status === 'overtime'}
                onSelectTemplate={() => {}}
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
          speechTitle={currentSpeech.title}
          targetSeconds={pendingReviewData.targetSeconds}
          actualSeconds={pendingReviewData.actualSeconds}
          isOvertime={pendingReviewData.isOvertime}
          overtimeSeconds={pendingReviewData.overtimeSeconds}
          recordedAudio={pendingReviewData.recordedAudio}
          onSaveRecord={handleSaveReviewedRecord}
          onDiscard={handleDiscardReview}
        />
      )}
    </div>
  );
}
