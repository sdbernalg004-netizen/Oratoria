import React, { useState } from 'react';
import { RehearsalRecord, AISpeechAnalysis } from '../types';
import { RecordedAudioResult } from '../hooks/useVoiceRecorder';
import { formatHumanTime } from '../hooks/useSpeechTimer';
import {
  CheckCircle,
  AlertTriangle,
  Star,
  Download,
  Trash2,
  Save,
  Volume2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RehearsalReviewModalProps {
  isOpen: boolean;
  speechTitle: string;
  targetSeconds: number;
  actualSeconds: number;
  isOvertime: boolean;
  overtimeSeconds: number;
  recordedAudio: RecordedAudioResult | null;
  onSaveRecord: (record: Omit<RehearsalRecord, 'id' | 'timestamp'>) => void;
  onDiscard: () => void;
  onRequestAIAnalysis?: () => void;
  aiAnalysis?: AISpeechAnalysis | null;
  isAnalyzingAI?: boolean;
}

export const RehearsalReviewModal: React.FC<RehearsalReviewModalProps> = ({
  isOpen,
  speechTitle,
  targetSeconds,
  actualSeconds,
  isOvertime,
  overtimeSeconds,
  recordedAudio,
  onSaveRecord,
  onDiscard,
  onRequestAIAnalysis,
  aiAnalysis,
  isAnalyzingAI = false,
}) => {
  const [rating, setRating] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const delta = actualSeconds - targetSeconds;
  const isCloseToTarget = Math.abs(delta) <= 15;

  const handleSave = () => {
    onSaveRecord({
      speechTitle,
      targetSeconds,
      actualSeconds,
      isOvertime,
      overtimeSeconds,
      audioBlobUrl: recordedAudio?.url,
      rating,
      notes,
      aiAnalysis: aiAnalysis || undefined,
    });
  };

  const handleDownloadAudio = () => {
    if (!recordedAudio) return;
    const a = document.createElement('a');
    a.href = recordedAudio.url;
    a.download = `ensayo-${speechTitle.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2 mb-1">
            {isCloseToTarget ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : isOvertime ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Clock className="w-5 h-5 text-blue-400" />
            )}
            <h3 className="text-base font-bold text-white">Evaluación de Ensayo Finalizado</h3>
          </div>
          <p className="text-xs text-neutral-400 truncate">
            Discurso: <span className="text-neutral-200">{speechTitle}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Timing Comparison Card */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
            <div>
              <span className="block text-[11px] text-neutral-400 mb-1">Tiempo Objetivo</span>
              <span className="text-base font-mono font-bold text-white">
                {formatHumanTime(targetSeconds)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-400 mb-1">Tiempo Logrado</span>
              <span
                className={`text-base font-mono font-bold ${
                  isOvertime ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatHumanTime(actualSeconds)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-neutral-400 mb-1">Diferencia</span>
              <span
                className={`text-base font-mono font-bold ${
                  isCloseToTarget
                    ? 'text-emerald-400'
                    : isOvertime
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {delta > 0 ? `+${delta}s` : `${delta}s`}
              </span>
            </div>
          </div>

          {/* AI Oratory Coach Action Button */}
          {onRequestAIAnalysis && (
            <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Entrenador de Oratoria con IA
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {aiAnalysis
                      ? `Análisis generado: Puntaje ${aiAnalysis.overallScore}/100`
                      : 'Analiza tu voz, modulación y contraste con el bosquejo'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onRequestAIAnalysis}
                disabled={isAnalyzingAI}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isAnalyzingAI
                    ? 'Analizando...'
                    : aiAnalysis
                    ? 'Ver Análisis'
                    : 'Analizar Voz con IA'}
                </span>
              </button>
            </div>
          )}

          {/* Audio Recording playback if available */}
          {recordedAudio && (
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-neutral-200 font-medium">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Grabación del Ensayo ({recordedAudio.duration}s)</span>
                </span>
                <button
                  onClick={handleDownloadAudio}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>

              <audio controls src={recordedAudio.url} className="w-full h-9 rounded-lg" />
            </div>
          )}

          {/* Self-Rating (1-5 stars) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Autoevaluación de la toma: ¿Cómo sentiste tu dicción, ritmo y pausas?
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-700 hover:text-neutral-500'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs text-neutral-400 ml-2">
                {rating === 5
                  ? '¡Excelente ritmo y soltura!'
                  : rating === 4
                  ? 'Buen ensayo con fluidez'
                  : rating === 3
                  ? 'Aceptable, ajustar pausas'
                  : 'Requiere más práctica'}
              </span>
            </div>
          </div>

          {/* Feedback & Takeaway Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Notas y observaciones de mejora para el próximo ensayo
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ej: Bajar la velocidad en el punto 2, enfatizar la conclusión y cuidar la pausa de 3 segundos..."
              className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-800 bg-neutral-950/60">
          <button
            onClick={onDiscard}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar Toma</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar en Historial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
