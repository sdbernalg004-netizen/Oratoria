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
} from 'lucide-react';

interface SpeechTeleprompterProps {
  currentSpeech: SpeechDraft;
  onUpdateSpeech: (updated: SpeechDraft) => void;
  isTimerRunning: boolean;
  onSelectTemplate: (templateId: string) => void;
  activePdfUrl?: string;
}

export const SpeechTeleprompter: React.FC<SpeechTeleprompterProps> = ({
  currentSpeech,
  onUpdateSpeech,
  isTimerRunning,
  activePdfUrl,
}) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [viewMode, setViewMode] = useState<'sections' | 'fulltext' | 'pdf'>('sections');
  const [autoScroll, setAutoScroll] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.5);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

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

  // Calculate words and estimated reading time
  const fullTextContent =
    viewMode === 'fulltext'
      ? currentSpeech.fullText
      : currentSpeech.sections.map((s) => `${s.title}\n${s.notes}`).join('\n\n');

  const wordCount = fullTextContent.trim() ? fullTextContent.trim().split(/\s+/).length : 0;
  // Standard speech cadence: 135 words per minute
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
      title: `Punto ${currentSpeech.sections.length + 1}`,
      notes: '• Escribe aquí tus argumentos clave o recordatorios visuales.',
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
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'sections'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Secciones ({currentSpeech.sections.length})
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
              <FileCheck className="w-3 h-3 text-purple-300" />
              <span>Visor PDF</span>
            </button>
          )}
        </div>

        {/* Font Size & Teleprompter scroll controls */}
        {viewMode !== 'pdf' && (
          <div className="flex items-center gap-2">
            {/* Font Size Adjusters */}
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

            {/* Auto-Scroll Toggle */}
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

      {/* Speech Metrics Kicker */}
      {viewMode !== 'pdf' && (
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-950/40 border-b border-neutral-800/60 text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>{wordCount} palabras</span>
            <span>·</span>
            <span>~{estimatedMin} min de lectura (~135 ppm)</span>
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
          <div className="space-y-3">
            {currentSpeech.sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-3.5 bg-neutral-950/70 border border-neutral-800/90 rounded-xl transition-all hover:border-neutral-700/80 group"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/60 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center text-[10px]">
                      0{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(sec.id, { title: e.target.value })}
                      className="bg-transparent font-semibold text-white focus:outline-none hover:border-b hover:border-neutral-700 flex-1"
                      placeholder="Nombre de sección"
                    />
                    {sec.estimatedMinutes && (
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded">
                        ~{sec.estimatedMinutes}m
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={sec.notes}
                  onChange={(e) => handleUpdateSection(sec.id, { notes: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent text-neutral-300 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed"
                  placeholder="Puntos clave, anécdotas o recordatorios para este tramo del discurso..."
                />
              </div>
            ))}

            <button
              onClick={handleAddSection}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-800 hover:border-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-950/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Sección al Discurso</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
