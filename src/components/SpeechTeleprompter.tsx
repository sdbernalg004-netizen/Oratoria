import React, { useState, useEffect, useRef } from 'react';
import { SpeechDraft, SpeechSection } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Play,
  Pause,
  BookOpen,
  FileCheck,
  Upload,
  CheckCircle2,
  ListOrdered,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
  LayoutGrid,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface SpeechTeleprompterProps {
  currentSpeech: SpeechDraft;
  onUpdateSpeech: (updated: SpeechDraft) => void;
  isTimerRunning: boolean;
  onSelectTemplate: (templateId: string) => void;
  activePdfUrl?: string;
  onUploadFile?: (file: File) => void;
  isProcessingFile?: boolean;
  atrilTimerMode?: 'standard' | 'compact' | 'floating';
  onSetAtrilTimerMode?: (mode: 'standard' | 'compact' | 'floating') => void;
}

export const SpeechTeleprompter: React.FC<SpeechTeleprompterProps> = ({
  currentSpeech,
  onUpdateSpeech,
  isTimerRunning,
  activePdfUrl,
  onUploadFile,
  isProcessingFile = false,
  atrilTimerMode = 'standard',
  onSetAtrilTimerMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [viewMode, setViewMode] = useState<'sections' | 'fulltext' | 'pdf'>('sections');
  const [autoScroll, setAutoScroll] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.5);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll loop
  useEffect(() => {
    let animId: number;

    const scrollStep = () => {
      if (autoScroll && containerRef.current) {
        containerRef.current.scrollTop += scrollSpeed * 0.4;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    if (autoScroll) {
      animId = requestAnimationFrame(scrollStep);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [autoScroll, scrollSpeed]);

  const toggleCheckPoint = (pointKey: string) => {
    setCheckedPoints((prev) => ({
      ...prev,
      [pointKey]: !prev[pointKey],
    }));
  };

  const fullTextContent =
    viewMode === 'fulltext'
      ? currentSpeech.fullText
      : currentSpeech.sections.map((s) => `${s.title}\n${s.notes}`).join('\n\n');

  const wordCount = fullTextContent.trim() ? fullTextContent.trim().split(/\s+/).length : 0;
  const estimatedMin = Math.round((wordCount / 135) * 10) / 10;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSpeech({
      ...currentSpeech,
      title: e.target.value,
      lastEdited: Date.now(),
    });
  };

  const handleFullTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateSpeech({
      ...currentSpeech,
      fullText: e.target.value,
      lastEdited: Date.now(),
    });
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<SpeechSection>) => {
    const updatedSections = currentSpeech.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, ...updates } : sec
    );
    onUpdateSpeech({
      ...currentSpeech,
      sections: updatedSections,
      lastEdited: Date.now(),
    });
  };

  const handleAddSection = () => {
    const newSec: SpeechSection = {
      id: `sec-${Date.now()}`,
      title: `${currentSpeech.sections.length + 1}. Nuevo Punto Principal`,
      estimatedMinutes: 1.5,
      notes: '• Escribe aquí los argumentos o ilustración de esta sección.',
      keyPoints: ['Punto clave a enfatizar'],
    };
    onUpdateSpeech({
      ...currentSpeech,
      sections: [...currentSpeech.sections, newSec],
      lastEdited: Date.now(),
    });
    setEditingSectionId(newSec.id);
  };

  const handleDeleteSection = (sectionId: string) => {
    onUpdateSpeech({
      ...currentSpeech,
      sections: currentSpeech.sections.filter((s) => s.id !== sectionId),
      lastEdited: Date.now(),
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Lectern Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-neutral-800 bg-neutral-950/60">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            type="text"
            value={currentSpeech.title}
            onChange={handleTitleChange}
            className="w-full bg-transparent font-semibold text-white text-sm sm:text-base focus:outline-none border-b border-transparent hover:border-neutral-700 focus:border-blue-500 transition-colors px-1"
            placeholder="Título del Discurso..."
          />
        </div>

        {/* View Switcher: Secciones / Texto Continuo / PDF */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setViewMode('sections')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'sections'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Secciones ({currentSpeech.sections.length})</span>
          </button>
          <button
            onClick={() => setViewMode('fulltext')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'fulltext'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Guión Completo
          </button>
          {activePdfUrl && (
            <button
              onClick={() => setViewMode('pdf')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'pdf'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Visor PDF</span>
            </button>
          )}
        </div>

        {/* Direct Upload button right in Atril Dividido */}
        {onUploadFile && (
          <div className="flex items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              title="Subir archivo PDF o bosquejo para recargar secciones y puntos clave automáticamente"
            >
              {isProcessingFile ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cargando Secciones...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir PDF / Bosquejo</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Layout size mode toggle: Normal, Compacto, Flotante (Texto 100%) */}
        {onSetAtrilTimerMode && (
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            {atrilTimerMode === 'floating' ? (
              <button
                onClick={() => onSetAtrilTimerMode('standard')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 hover:text-white transition-colors"
                title="Volver a mostrar el cronómetro a la izquierda"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Fijar Cronómetro</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => onSetAtrilTimerMode(atrilTimerMode === 'compact' ? 'standard' : 'compact')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    atrilTimerMode === 'compact'
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title={atrilTimerMode === 'compact' ? 'Volver a cronómetro normal' : 'Hacer cronómetro más pequeño para ganar más espacio de texto'}
                >
                  <Minimize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">{atrilTimerMode === 'compact' ? 'Normal' : 'Texto +30%'}</span>
                </button>
                <button
                  onClick={() => onSetAtrilTimerMode('floating')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-950/40 hover:bg-purple-900/40 border border-purple-700/50 text-purple-300 hover:text-white transition-colors"
                  title="Expandir texto al 100% de la pantalla y usar cronómetro flotante pequeño"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Texto 100% (Flotante)</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Font Size & Teleprompter scroll controls */}
        {viewMode !== 'pdf' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-900 rounded-lg border border-neutral-800 px-1.5 py-0.5">
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="px-1.5 py-0.5 text-xs text-neutral-400 hover:text-white transition-colors"
                title="Reducir fuente"
              >
                A-
              </button>
              <span className="text-[11px] font-mono text-neutral-400 px-1">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(32, s + 2))}
                className="px-1.5 py-0.5 text-xs text-neutral-400 hover:text-white transition-colors"
                title="Aumentar fuente"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setAutoScroll((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                autoScroll
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={autoScroll ? 'Detener teleprómpter' : 'Iniciar auto-desplazamiento'}
            >
              {autoScroll ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span className="hidden sm:inline">Teleprómpter</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Header */}
      {viewMode !== 'pdf' && (
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-950/40 border-b border-neutral-800/60 text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>{currentSpeech.sections.length} secciones cargadas</span>
            <span>·</span>
            <span>{wordCount} palabras (~{estimatedMin} min de discurso)</span>
          </div>
          {autoScroll && (
            <div className="flex items-center gap-2">
              <span>Velocidad:</span>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                className="w-16 accent-emerald-500 h-1 bg-neutral-800 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4"
        style={{ fontSize: `${fontSize}px` }}
      >
        {viewMode === 'pdf' && activePdfUrl ? (
          <div className="w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
            <iframe
              src={activePdfUrl}
              className="w-full h-full min-h-[500px] border-0"
              title="PDF en Atril"
            />
          </div>
        ) : viewMode === 'fulltext' ? (
          <textarea
            value={currentSpeech.fullText}
            onChange={handleFullTextChange}
            placeholder="Pega aquí el texto completo de tu discurso para leerlo como teleprómpter durante tu ensayo..."
            className="w-full h-full min-h-[380px] bg-transparent text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed tracking-normal font-sans"
          />
        ) : (
          /* Secciones y Puntos Claves */
          <div className="space-y-3.5">
            {currentSpeech.sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-4 bg-neutral-950/80 border border-neutral-800/90 rounded-xl transition-all hover:border-neutral-700/80 group shadow-sm"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/60 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-md bg-blue-950 text-blue-400 border border-blue-800/40 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                      0{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(sec.id, { title: e.target.value })}
                      className="bg-transparent font-bold text-white text-sm sm:text-base focus:outline-none hover:border-b hover:border-neutral-700 flex-1 truncate"
                      placeholder="Título de la Sección"
                    />
                    {sec.estimatedMinutes && (
                      <span className="text-[11px] font-mono font-medium text-blue-300 bg-blue-950/60 border border-blue-900/40 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>~{sec.estimatedMinutes}m</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Key Points (Puntos Clave) if present */}
                {sec.keyPoints && sec.keyPoints.length > 0 && (
                  <div className="my-2.5 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        <span>Puntos Clave para la Oratoria:</span>
                      </span>
                      <span className="text-neutral-500 text-[10px] lowercase font-normal">
                        marca al exponer
                      </span>
                    </div>

                    <div className="space-y-1">
                      {sec.keyPoints.map((point, pIdx) => {
                        const pointKey = `${sec.id}-pt-${pIdx}`;
                        const isChecked = !!checkedPoints[pointKey];
                        return (
                          <div
                            key={pIdx}
                            onClick={() => toggleCheckPoint(pointKey)}
                            className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-950/30 text-neutral-400 line-through opacity-75'
                                : 'hover:bg-neutral-800/50 text-neutral-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCheckPoint(pointKey)}
                              className="mt-0.5 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs sm:text-sm leading-snug flex-1">
                              {point}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section Notes / Narrative guide */}
                <textarea
                  value={sec.notes}
                  onChange={(e) => handleUpdateSection(sec.id, { notes: e.target.value })}
                  rows={2}
                  className="w-full bg-transparent text-neutral-300 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed text-xs sm:text-sm mt-1"
                  placeholder="Notas, citas o recordatorios visuales para esta sección..."
                />
              </div>
            ))}

            <button
              onClick={handleAddSection}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-950/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Sección Manualmente</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
