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
  SpeechSection,
} from './types';
import { useSpeechTimer, TimerStatus } from './hooks/useSpeechTimer';
import { useVoiceRecorder, RecordedAudioResult } from './hooks/useVoiceRecorder';
import { saveAudioBlob } from './utils/audioStorage';
import { useAuth } from './context/AuthContext';
import {
  saveSpeechOutline,
  deleteSpeechOutline,
  subscribeToUserSpeeches,
  saveRehearsalLog,
  subscribeToUserRehearsals,
  getUserProfile,
  updateUserJwStatus,
} from './services/speechCloudService';
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
import { SavedSpeechesModal } from './components/SavedSpeechesModal';
import { JwAffiliationModal } from './components/JwAffiliationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Cloud, Check, AlertCircle, Clock, Layers, LayoutGrid, Minimize2, Maximize2 } from 'lucide-react';

export default function App() {
  const { user } = useAuth();

  // Navigation / View State
  const [currentView, setCurrentView] = useState<'reader-floating' | 'split' | 'timer-only' | 'history'>('split');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Atril Dividido layout mode: 'standard' (5 cols) | 'compact' (3 cols) | 'floating' (small floating timer, 100% text)
  const [atrilTimerMode, setAtrilTimerMode] = useState<'standard' | 'compact' | 'floating'>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_atril_timer_mode');
      return (saved as 'standard' | 'compact' | 'floating') || 'standard';
    } catch {
      return 'standard';
    }
  });

  // Auto-switch to small floating timer upon starting speech in Atril Dividido
  const [autoFloatOnStart, setAutoFloatOnStart] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_autofloat_on_start');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_atril_timer_mode', atrilTimerMode);
    } catch {}
  }, [atrilTimerMode]);

  useEffect(() => {
    try {
      localStorage.setItem('oratoriapro_autofloat_on_start', JSON.stringify(autoFloatOnStart));
    } catch {}
  }, [autoFloatOnStart]);

  // Modals
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCoachReportOpen, setIsCoachReportOpen] = useState(false);
  const [isSavedSpeechesOpen, setIsSavedSpeechesOpen] = useState(false);
  const [isJwModalOpen, setIsJwModalOpen] = useState(false);
  const [isJwPromptFirstTime, setIsJwPromptFirstTime] = useState(false);

  // JW Theocratic Ministry School Oratory Affiliation ("Benefíciese" book vs General)
  const [isJehovahsWitness, setIsJehovahsWitness] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem('oratoriapro_is_jw');
      return saved !== null ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  }, []);

  // When user signs in, check if they already answered the JW affiliation question
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then((profile) => {
        if (profile && typeof profile.isJehovahsWitness === 'boolean') {
          setIsJehovahsWitness(profile.isJehovahsWitness);
          try {
            localStorage.setItem('oratoriapro_is_jw', JSON.stringify(profile.isJehovahsWitness));
          } catch {}
        } else {
          // If preference has not yet been set in profile or locally, open the prompt upon login!
          const localVal = localStorage.getItem('oratoriapro_is_jw');
          if (localVal === null) {
            setIsJwPromptFirstTime(true);
            setIsJwModalOpen(true);
          }
        }
      })
      .catch((err) => console.warn('Error reading user profile for JW preference:', err));
  }, [user]);

  const handleSelectJwAffiliation = async (isJw: boolean) => {
    setIsJehovahsWitness(isJw);
    try {
      localStorage.setItem('oratoriapro_is_jw', JSON.stringify(isJw));
    } catch {}

    if (user) {
      try {
        await updateUserJwStatus(user.uid, isJw);
      } catch (err) {
        console.warn('Error updating JW preference in Firestore:', err);
      }
    }

    if (isJw) {
      showToast('Enfoque activado: Libro «Benefíciese de la Escuela del Ministerio Teocrático» (jw.org)', 'success');
    } else {
      showToast('Enfoque activado: Técnicas universales de oratoria contemporánea y Toastmasters', 'info');
    }
  };

  // File uploading and extraction state
  const [isUploadingToAtril, setIsUploadingToAtril] = useState(false);

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
      // Auto-switch to floating timer upon starting in Atril Dividido so user gets maximum reading space
      if (newStatus === 'running' && currentView === 'split' && autoFloatOnStart && atrilTimerMode === 'standard') {
        setAtrilTimerMode('floating');
        showToast('Cronómetro reducido a flotante. ¡Texto de oratoria ampliado al 100%!', 'info');
      }

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

  // Subscribe to Cloud Firestore when user is logged in
  useEffect(() => {
    if (!user) return;

    // Speeches subscription
    const unsubSpeeches = subscribeToUserSpeeches(user.uid, (cloudSpeeches, cloudDocs) => {
      if (cloudSpeeches.length > 0) {
        setSpeeches((prevLocal) => {
          // Merge avoiding duplicates, prioritizing cloud items
          const cloudIds = new Set(cloudSpeeches.map((s) => s.id));
          const localOnly = prevLocal.filter((s) => !cloudIds.has(s.id));
          return [...cloudSpeeches, ...localOnly];
        });

        setDocuments((prevDocs) => {
          const cloudDocIds = new Set(cloudDocs.map((d) => d.id));
          const localDocsOnly = prevDocs.filter((d) => !cloudDocIds.has(d.id));
          return [...cloudDocs, ...localDocsOnly];
        });
      }
    });

    // Rehearsals subscription
    const unsubRehearsals = subscribeToUserRehearsals(user.uid, (cloudRehearsals) => {
      if (cloudRehearsals.length > 0) {
        setRehearsals((prevLocal) => {
          const cloudIds = new Set(cloudRehearsals.map((r) => r.id));
          const localOnly = prevLocal.filter((r) => !cloudIds.has(r.id));
          return [...cloudRehearsals, ...localOnly].sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    });

    return () => {
      unsubSpeeches();
      unsubRehearsals();
    };
  }, [user]);

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

  /**
   * Select a speech to load into the lectern and timer
   */
  const handleSelectSpeech = (speechId: string) => {
    const idx = speeches.findIndex((s) => s.id === speechId);
    if (idx !== -1) {
      setActiveSpeechIndex(idx);
      const chosen = speeches[idx];
      setTargetSeconds(chosen.targetSeconds || 420);

      // Match corresponding document if available
      const matchedDoc = documents.find((d) => d.id === `doc-${chosen.id}` || d.title === chosen.title);
      if (matchedDoc) {
        setCurrentDocId(matchedDoc.id);
      }

      showToast(`Bosquejo "${chosen.title}" cargado en el atril`, 'info');
    }
  };

  /**
   * Delete speech handler (from local and Firestore if logged in)
   */
  const handleDeleteSpeech = async (speechId: string) => {
    setSpeeches((prev) => prev.filter((s) => s.id !== speechId));
    setActiveSpeechIndex((prev) => Math.max(0, prev - 1));

    if (user) {
      try {
        await deleteSpeechOutline(speechId);
        showToast('Bosquejo eliminado de tu cuenta en la nube', 'info');
      } catch (err) {
        console.error('Error deleting speech from Firestore:', err);
      }
    }
  };

  /**
   * Helper to divide raw verbatim text into pages preserving exact paragraphs and words
   */
  const splitTextIntoVerbatimPages = (rawText: string, maxCharsPerPage: number = 900): string[] => {
    if (!rawText || !rawText.trim()) return [''];
    const paragraphs = rawText.split('\n\n');
    const pages: string[] = [];
    let currentPage = '';

    for (const para of paragraphs) {
      if ((currentPage + '\n\n' + para).length > maxCharsPerPage && currentPage.trim().length > 0) {
        pages.push(currentPage.trim());
        currentPage = para;
      } else {
        currentPage = currentPage ? `${currentPage}\n\n${para}` : para;
      }
    }
    if (currentPage.trim().length > 0) {
      pages.push(currentPage.trim());
    }
    return pages.length > 0 ? pages : [rawText];
  };

  /**
   * Unified file uploader: Extracts sections and key points with Gemini and loads them into Atril Dividido!
   * Guarantees 100% verbatim fidelity so user ideas remain untouched.
   * Automatically persists to Firestore when logged in.
   */
  const handleUploadAndExtractFile = async (file: File) => {
    setIsUploadingToAtril(true);
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isWord =
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.type.includes('word') ||
        file.type.includes('officedocument');

      let newSpeech: SpeechDraft;
      let newDoc: SourceDocument;

      if (isWord) {
        // Handle Word (.docx / .doc) documents
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const docxBase64 = await base64Promise;

        const res = await fetch('/api/extract-docx-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docxBase64, fileName }),
        });

        const resData = await res.json();
        let extractedData = {
          title: fileName,
          fullText: '',
          sections: [] as SpeechSection[],
          suggestedTargetSeconds: 420,
        };

        if (resData.success && resData.data) {
          extractedData = resData.data;
        }

        // 100% verbatim text directly from mammoth or raw extraction
        const verbatimWordText = resData.rawText || extractedData.fullText || '';
        const wordPages = splitTextIntoVerbatimPages(verbatimWordText);

        newSpeech = {
          id: `speech_${Date.now()}`,
          title: extractedData.title || fileName,
          topic: 'Discurso desde Word',
          targetSeconds: extractedData.suggestedTargetSeconds || 420,
          sections:
            extractedData.sections && extractedData.sections.length > 0
              ? extractedData.sections
              : [
                  {
                    id: 'sec-1',
                    title: '1. Bosquejo Completo',
                    estimatedMinutes: Math.round((verbatimWordText.split(/\s+/).length / 135) * 10) / 10,
                    notes: verbatimWordText.slice(0, 500),
                    keyPoints: ['Puntos del documento'],
                  },
                ],
          fullText: verbatimWordText,
          lastEdited: Date.now(),
        };

        newDoc = {
          id: `doc_word_${Date.now()}`,
          title: extractedData.title || fileName,
          type: 'text',
          content: verbatimWordText,
          pages: wordPages,
          currentPage: 1,
          totalPages: Math.max(1, wordPages.length),
          theme: 'dark',
          fontSize: 22,
          lineHeight: 1.7,
        };
      } else if (isPdf) {
        const pdfUrl = URL.createObjectURL(file);

        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const pdfBase64 = await base64Promise;

        // Call backend Gemini extraction
        const res = await fetch('/api/extract-pdf-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64, fileName }),
        });

        const resData = await res.json();
        let extractedData = {
          title: fileName,
          fullText: '',
          sections: [] as SpeechSection[],
          suggestedTargetSeconds: 420,
        };

        if (resData.success && resData.data) {
          extractedData = resData.data;
        }

        // 100% verbatim text extracted from PDF
        const verbatimPdfText = extractedData.fullText || '';
        const pdfPages = splitTextIntoVerbatimPages(verbatimPdfText);

        newSpeech = {
          id: `speech_${Date.now()}`,
          title: extractedData.title || fileName,
          topic: 'Discurso desde PDF',
          targetSeconds: extractedData.suggestedTargetSeconds || 420,
          sections:
            extractedData.sections && extractedData.sections.length > 0
              ? extractedData.sections
              : [
                  {
                    id: 'sec-1',
                    title: '1. Bosquejo de Oratoria',
                    estimatedMinutes: Math.round((verbatimPdfText.split(/\s+/).length / 135) * 10) / 10,
                    notes: verbatimPdfText.slice(0, 500),
                    keyPoints: ['Ideas principales del PDF'],
                  },
                ],
          fullText: verbatimPdfText,
          lastEdited: Date.now(),
        };

        newDoc = {
          id: `doc_pdf_${Date.now()}`,
          title: extractedData.title || fileName,
          type: 'pdf',
          content: verbatimPdfText,
          pdfUrl,
          pages: pdfPages,
          currentPage: 1,
          totalPages: Math.max(1, pdfPages.length),
          theme: 'dark',
          fontSize: 20,
          lineHeight: 1.6,
        };
      } else {
        // Plain text or markdown
        const textReader = new FileReader();
        const textPromise = new Promise<string>((resolve) => {
          textReader.onload = (e) => resolve((e.target?.result as string) || '');
        });
        textReader.readAsText(file);
        const text = await textPromise;
        const paragraphs = text.split('\n\n').filter(Boolean);

        const sections: SpeechSection[] = paragraphs.slice(0, 5).map((para, i) => {
          const lines = para.split('\n').filter(Boolean);
          return {
            id: `sec-${i + 1}`,
            title:
              i === 0
                ? '1. Introducción'
                : i === paragraphs.length - 1
                ? `${i + 1}. Conclusión`
                : `Punto ${i + 1}`,
            estimatedMinutes: 1.5,
            notes: para.slice(0, 300),
            keyPoints: lines.slice(0, 3).map((l) => l.replace(/^[-•*]\s*/, '').slice(0, 80)),
          };
        });

        const verbatimTextPages = splitTextIntoVerbatimPages(text);

        newSpeech = {
          id: `speech_${Date.now()}`,
          title: fileName,
          topic: 'Bosquejo Importado',
          targetSeconds: Math.max(120, Math.round((text.split(/\s+/).length / 135) * 60)),
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    id: 'sec-1',
                    title: '1. Bosquejo',
                    estimatedMinutes: 1.5,
                    notes: text.slice(0, 300),
                    keyPoints: ['Punto inicial'],
                  },
                ],
          fullText: text,
          lastEdited: Date.now(),
        };

        newDoc = {
          id: `doc_text_${Date.now()}`,
          title: fileName,
          type: 'text',
          content: text,
          pages: verbatimTextPages,
          currentPage: 1,
          totalPages: Math.max(1, verbatimTextPages.length),
          theme: 'dark',
          fontSize: 22,
          lineHeight: 1.7,
        };
      }

      // Update state
      setDocuments((prev) => [newDoc, ...prev]);
      setCurrentDocId(newDoc.id);

      setSpeeches((prev) => [newSpeech, ...prev]);
      setActiveSpeechIndex(0);

      if (newSpeech.targetSeconds) {
        setTargetSeconds(newSpeech.targetSeconds);
      }

      // If user is authenticated, save permanently to Firestore
      if (user) {
        try {
          await saveSpeechOutline(user.uid, newSpeech, newDoc);
          showToast(`Bosquejo "${newSpeech.title}" guardado íntegro en tu cuenta`, 'success');
        } catch (cloudErr) {
          console.error('Error saving speech to cloud:', cloudErr);
          showToast('Guardado localmente. Hubo un detalle al sincronizar con la nube.', 'info');
        }
      } else {
        showToast(`Bosquejo guardado íntegro localmente. ¡Inicia sesión para sincronizarlo!`, 'info');
      }

      // Switch automatically to 'split' (Atril Dividido) with loaded sections and key points
      setCurrentView('split');
    } catch (err: any) {
      console.error('Error in handleUploadAndExtractFile:', err);
      showToast('Error al procesar el archivo. Intenta nuevamente.', 'error');
    } finally {
      setIsUploadingToAtril(false);
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
            resolve(dataUrl.split(',')[1]);
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
          speechTitle: currentSpeech.title,
          targetSeconds: pendingReviewData.targetSeconds,
          actualSeconds: pendingReviewData.actualSeconds,
          referenceSourceText,
          audioBase64,
          audioMimeType: mimeType,
          userNotes: '',
          isJehovahsWitness: isJehovahsWitness ?? false,
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

  // Save reviewed record into history, IndexedDB, and Firestore
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

    // Save to Firestore if user is authenticated
    if (user) {
      try {
        await saveRehearsalLog(user.uid, newRecord);
        showToast('Ensayo y retroalimentación guardados en tu cuenta', 'success');
      } catch (err) {
        console.error('Error saving rehearsal to Firestore:', err);
      }
    }

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
  const handleUpdateCurrentSpeech = async (updated: SpeechDraft) => {
    setSpeeches((prev) =>
      prev.map((s, idx) => (idx === activeSpeechIndex ? updated : s))
    );

    if (user) {
      try {
        await saveSpeechOutline(user.uid, updated, currentDoc);
      } catch (err) {
        console.warn('Could not auto-save speech update to Firestore:', err);
      }
    }
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
        if (isSavedSpeechesOpen) setIsSavedSpeechesOpen(false);
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
    isCoachReportOpen,
    isSavedSpeechesOpen,
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
        onOpenSavedSpeeches={() => setIsSavedSpeechesOpen(true)}
        speechesCount={speeches.length}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        historyCount={rehearsals.length}
        isJehovahsWitness={isJehovahsWitness}
        onOpenJwModal={() => {
          setIsJwPromptFirstTime(false);
          setIsJwModalOpen(true);
        }}
      />

      {/* Cloud feedback toast */}
      {toastMessage && (
        <div className="fixed top-16 right-5 z-50 animate-bounce flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 shadow-2xl text-xs font-medium text-white backdrop-blur-md">
          {toastMessage.type === 'success' ? (
            <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
            </span>
          ) : toastMessage.type === 'error' ? (
            <span className="p-1 rounded-full bg-red-500/20 text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="p-1 rounded-full bg-blue-500/20 text-blue-400">
              <Cloud className="w-3.5 h-3.5" />
            </span>
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full relative">
        {currentView === 'history' ? (
          <RehearsalHistoryView
            records={rehearsals}
            onDeleteRecord={(id) => setRehearsals((prev) => prev.filter((r) => r.id !== id))}
            onClearAll={() => setRehearsals([])}
            onClose={() => setCurrentView('split')}
            onViewAIReport={(analysis) => {
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
              onUploadFile={handleUploadAndExtractFile}
              isProcessingFile={isUploadingToAtril}
              onGoToSplitView={() => setCurrentView('split')}
              currentSpeech={currentSpeech}
              onUpdateSpeech={handleUpdateCurrentSpeech}
            />

            {/* The Adaptable Draggable Stopwatch/Timer Widget */}
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
          /* Modo Atril Dividido: Secciones y Puntos Claves con Cronómetro Redimensionable o Flotante */
          <div className="flex flex-col flex-1 gap-4">
            {/* Aviso superior cuando el cronómetro está en modo flotante */}
            {atrilTimerMode === 'floating' && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl text-xs text-neutral-300 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="font-semibold text-white">Cronómetro Flotante Pequeño Activo</span>
                  <span className="text-neutral-400 hidden md:inline">
                    · El bosquejo y puntos de la oratoria disfrutan del 100% del ancho de pantalla
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAtrilTimerMode('compact')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-xs transition-colors"
                    title="Ver cronómetro en barra lateral compacta"
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Modo Compacto</span>
                  </button>
                  <button
                    onClick={() => setAtrilTimerMode('standard')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    title="Fijar el cronómetro a la izquierda del atril"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Fijar Cronómetro al Atril</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
              {/* Columna Cronómetro (solo se muestra cuando NO está en modo flotante) */}
              {atrilTimerMode !== 'floating' && (
                <div
                  className={`${
                    atrilTimerMode === 'compact'
                      ? 'lg:col-span-4 xl:col-span-3'
                      : 'lg:col-span-6 xl:col-span-5'
                  } flex flex-col gap-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 justify-between transition-all duration-300`}
                >
                  <div>
                    {/* Barra de título del cronómetro con botones de tamaño */}
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                          {atrilTimerMode === 'compact' ? 'Cronómetro (Pequeño)' : 'Cronómetro'}
                        </span>
                      </div>

                      {/* Selectores de tamaño y modo */}
                      <div className="flex items-center gap-1 bg-neutral-950/70 p-0.5 rounded-lg border border-neutral-800">
                        <button
                          onClick={() => setAtrilTimerMode('standard')}
                          className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                            atrilTimerMode === 'standard'
                              ? 'bg-blue-600 text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title="Tamaño normal equilibrado"
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => setAtrilTimerMode('compact')}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                            atrilTimerMode === 'compact'
                              ? 'bg-blue-600 text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title="Hacer más pequeño el cronómetro (Más espacio para el texto de oratoria)"
                        >
                          <Minimize2 className="w-3 h-3" />
                          <span>Pequeño</span>
                        </button>
                        <button
                          onClick={() => setAtrilTimerMode('floating')}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium text-purple-300 hover:text-white hover:bg-purple-950/40 transition-colors"
                          title="Convertir en cronómetro flotante pequeño (100% ancho para bosquejo)"
                        >
                          <Layers className="w-3 h-3 text-purple-400" />
                          <span>Flotante</span>
                        </button>
                      </div>
                    </div>

                    <TimerDisplay
                      remainingSeconds={remainingSeconds}
                      overtimeSeconds={overtimeSeconds}
                      targetSeconds={targetSeconds}
                      elapsedSeconds={elapsedSeconds}
                      status={status}
                      progressPercent={progressPercent}
                      onAddSeconds={addSeconds}
                      isCompact={atrilTimerMode === 'compact'}
                    />

                    <div className="mt-3">
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
                        isCompact={atrilTimerMode === 'compact'}
                      />
                    </div>

                    {/* Switch: Al dar inicio, pasar a flotante pequeño */}
                    <div className="mt-4 pt-3 border-t border-neutral-800/60">
                      <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none hover:text-neutral-200 transition-colors">
                        <input
                          type="checkbox"
                          checked={autoFloatOnStart}
                          onChange={(e) => setAutoFloatOnStart(e.target.checked)}
                          className="rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>Al pulsar <strong>Iniciar</strong>: pasar a flotante pequeño automáticamente</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80">
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
              )}

              {/* Panel de Texto y Puntos de Oratoria: se expande a 12 cols si es flotante, 9 cols si es compacto, 7 cols si es standard */}
              <div
                className={`${
                  atrilTimerMode === 'floating'
                    ? 'col-span-12'
                    : atrilTimerMode === 'compact'
                    ? 'lg:col-span-8 xl:col-span-9'
                    : 'lg:col-span-6 xl:col-span-7'
                } flex flex-col h-[650px] lg:h-auto min-h-[500px] transition-all duration-300`}
              >
                <SpeechTeleprompter
                  currentSpeech={currentSpeech}
                  onUpdateSpeech={handleUpdateCurrentSpeech}
                  isTimerRunning={status === 'running' || status === 'overtime'}
                  onSelectTemplate={() => {}}
                  activePdfUrl={currentDoc?.pdfUrl}
                  onUploadFile={handleUploadAndExtractFile}
                  isProcessingFile={isUploadingToAtril}
                  atrilTimerMode={atrilTimerMode}
                  onSetAtrilTimerMode={setAtrilTimerMode}
                />
              </div>
            </div>

            {/* Widget de cronómetro flotante pequeño en pantalla cuando atrilTimerMode === 'floating' */}
            {atrilTimerMode === 'floating' && (
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
                onDockToSide={() => setAtrilTimerMode('standard')}
              />
            )}
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

      {/* Saved Speeches and Outlines Modal */}
      <SavedSpeechesModal
        isOpen={isSavedSpeechesOpen}
        onClose={() => setIsSavedSpeechesOpen(false)}
        speeches={speeches}
        activeSpeechId={currentSpeech.id}
        onSelectSpeech={handleSelectSpeech}
        onDeleteSpeech={handleDeleteSpeech}
        onOpenUpload={() => {
          // Open atril upload directly
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.docx,.doc,.txt,.md';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleUploadAndExtractFile(file);
          };
          input.click();
        }}
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
        speechTitle={currentSpeech.title}
      />

      {/* JW Theocratic Ministry School Affiliation & Privacy Modal */}
      <JwAffiliationModal
        isOpen={isJwModalOpen}
        onClose={() => setIsJwModalOpen(false)}
        currentValue={isJehovahsWitness}
        onSelectAffiliation={handleSelectJwAffiliation}
        isFirstTimePrompt={isJwPromptFirstTime}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
