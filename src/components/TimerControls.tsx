import React, { useState } from 'react';
import { TimerPreset } from '../types';
import { TimerStatus } from '../hooks/useSpeechTimer';
import { Play, Pause, RotateCcw, CheckSquare, SlidersHorizontal, Check } from 'lucide-react';

interface TimerControlsProps {
  status: TimerStatus;
  presets: TimerPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: TimerPreset) => void;
  onSetCustomTime: (minutes: number, seconds: number) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onFinishRehearsal: () => void;
  isRecording: boolean;
  isCompact?: boolean;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  status,
  presets,
  activePresetId,
  onSelectPreset,
  onSetCustomTime,
  onToggleTimer,
  onResetTimer,
  onFinishRehearsal,
  isRecording,
  isCompact = false,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMin, setCustomMin] = useState(6);
  const [customSec, setCustomSec] = useState(0);

  const isRunning = status === 'running' || status === 'overtime';

  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSec = Math.max(10, customMin * 60 + customSec);
    onSetCustomTime(Math.floor(totalSec / 60), totalSec % 60);
    setShowCustomModal(false);
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-xl mx-auto ${isCompact ? 'gap-3' : 'gap-6'}`}>
      {/* Primary Action Buttons */}
      <div className={`flex items-center ${isCompact ? 'gap-2 w-full justify-center' : 'gap-4'}`}>
        {/* Reset Button */}
        <button
          onClick={onResetTimer}
          className={`text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all shadow-sm active:scale-95 ${
            isCompact ? 'p-2.5' : 'p-3'
          }`}
          title="Reiniciar cronómetro (R)"
        >
          <RotateCcw className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>

        {/* Big Start/Pause Button */}
        <button
          onClick={onToggleTimer}
          className={`flex items-center justify-center font-semibold transition-all duration-200 shadow-lg active:scale-95 ${
            isCompact ? 'gap-2 px-5 py-2.5 rounded-xl text-sm' : 'gap-3 px-8 py-3.5 rounded-xl text-base'
          } ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
          }`}
          title="Iniciar o Pausar (Espacio)"
        >
          {isRunning ? (
            <>
              <Pause className={isCompact ? 'w-4 h-4 fill-current' : 'w-5 h-5 fill-current'} />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className={isCompact ? 'w-4 h-4 fill-current ml-0.5' : 'w-5 h-5 fill-current ml-0.5'} />
              <span>{status === 'paused' ? 'Reanudar' : 'Iniciar'}</span>
            </>
          )}
        </button>

        {/* Finish & Evaluate Rehearsal */}
        <button
          onClick={onFinishRehearsal}
          disabled={status === 'idle'}
          className={`flex items-center rounded-xl font-medium transition-all border ${
            isCompact ? 'gap-1.5 px-3 py-2.5 text-xs' : 'gap-2 px-4 py-3 text-sm'
          } ${
            status !== 'idle'
              ? 'bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50'
              : 'bg-neutral-950 text-neutral-600 border-neutral-900 cursor-not-allowed'
          }`}
          title="Finalizar ensayo y evaluar toma"
        >
          <CheckSquare className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          <span>{isCompact ? 'Finalizar' : 'Finalizar Toma'}</span>
        </button>
      </div>

      {/* Preset Timing Options */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5 px-1 text-xs text-neutral-400">
          <span className="text-[11px]">Tiempos preestablecidos</span>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium text-[11px]"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Personalizado</span>
          </button>
        </div>

        <div className={`grid gap-1.5 ${isCompact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'}`}>
          {presets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`flex flex-col rounded-lg text-left transition-all border ${
                  isCompact ? 'p-1.5' : 'p-2.5'
                } ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-neutral-900/70 hover:bg-neutral-900 border-neutral-800/80 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-semibold truncate ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{preset.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
                </div>
                <span className={`font-mono text-neutral-400 ${isCompact ? 'text-[10px]' : 'text-xs mt-1'}`}>
                  {preset.minutes}m {preset.seconds > 0 ? `${preset.seconds}s` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Time Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">
              Definir Tiempo Personalizado
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Ingresa los minutos y segundos exactos para tu ensayo.
            </p>

            <form onSubmit={handleApplyCustomTime}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={customMin}
                    onChange={(e) => setCustomMin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-center text-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Segundos
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSec}
                    onChange={(e) => setCustomSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-center text-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-800/60 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                >
                  Establecer Tiempo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
