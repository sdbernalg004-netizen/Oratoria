import React from 'react';
import { AISpeechAnalysis } from '../types';
import {
  Sparkles,
  X,
  Award,
  Zap,
  CheckCircle2,
  TrendingUp,
  Volume2,
  BookOpen,
  Dumbbell,
  Download,
} from 'lucide-react';

interface SpeechCoachReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AISpeechAnalysis | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  speechTitle: string;
}

export const SpeechCoachReportModal: React.FC<SpeechCoachReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  errorMessage,
  onRetry,
  speechTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Entrenador de Oratoria IA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-neutral-400 truncate max-w-md">
                Análisis de voz, cadencia y contraste con tu bosquejo: {speechTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Analizando tu voz y oratoria...
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Evaluando el ritmo, la modulación, la estructura del bosquejo y
                  generando consejos personalizados para tu próximo ensayo.
                </p>
              </div>
            </div>
          )}

          {errorMessage && !isLoading && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs space-y-2">
              <p className="font-semibold">No se pudo completar el análisis</p>
              <p>{errorMessage}</p>
              <button
                onClick={onRetry}
                className="mt-2 px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg transition-colors"
              >
                Reintentar Análisis
              </button>
            </div>
          )}

          {analysis && !isLoading && (
            <div className="space-y-6">
              {/* Score & Executive Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-neutral-950 rounded-2xl border border-neutral-800 items-center">
                <div className="sm:col-span-1 flex flex-col items-center justify-center text-center p-2 border-b sm:border-b-0 sm:border-r border-neutral-800">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-mono">
                    {analysis.overallScore}
                  </span>
                  <span className="text-[11px] text-neutral-400 uppercase tracking-wider mt-1">
                    Puntaje Global
                  </span>
                </div>

                <div className="sm:col-span-3 text-xs leading-relaxed text-neutral-300">
                  <h5 className="font-semibold text-white text-sm mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Diagnóstico de la Toma</span>
                  </h5>
                  <p>{analysis.summary}</p>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pacing */}
                <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ritmo y Tiempo</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        analysis.pacingAnalysis.status === 'Adecuado'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      }`}
                    >
                      {analysis.pacingAnalysis.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {analysis.pacingAnalysis.feedback}
                  </p>
                </div>

                {/* Diction & Modulation */}
                <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Voz y Modulación</span>
                    </span>
                    <span className="text-xs font-bold font-mono text-purple-400">
                      {analysis.dictionAndModulation.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {analysis.dictionAndModulation.feedback}
                  </p>
                </div>

                {/* Outline Coverage */}
                <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fidelidad al Bosquejo</span>
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {analysis.outlineCoverage.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {analysis.outlineCoverage.feedback}
                  </p>
                </div>
              </div>

              {/* Actionable Tips */}
              <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Consejos Accionables para tu Siguiente Ensayo</span>
                </h5>
                <ul className="space-y-2.5">
                  {analysis.actionableTips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Vocal Exercise */}
              {analysis.recommendedExercise && (
                <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-start gap-3 text-xs text-purple-200">
                  <Dumbbell className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-purple-300 mb-0.5">
                      Ejercicio Vocal / Respiratorio Recomendado:
                    </strong>
                    <p className="leading-relaxed">{analysis.recommendedExercise}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-neutral-800 bg-neutral-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};
