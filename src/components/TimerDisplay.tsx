import React, { useState, useEffect } from 'react';
import { TimerStatus, formatSecondsToDigital, formatHumanTime } from '../hooks/useSpeechTimer';
import {
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Timer,
  Hourglass,
  Flag,
  Trash2,
} from 'lucide-react';

interface TimerDisplayProps {
  remainingSeconds: number;
  overtimeSeconds: number;
  targetSeconds: number;
  elapsedSeconds: number;
  status: TimerStatus;
  progressPercent: number;
  onAddSeconds: (delta: number) => void;
  isCompact?: boolean;
  timerMode?: 'temporizador' | 'cronometro';
  onTimerModeChange?: (mode: 'temporizador' | 'cronometro') => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingSeconds,
  overtimeSeconds,
  targetSeconds,
  elapsedSeconds,
  status,
  progressPercent,
  onAddSeconds,
  isCompact = false,
  timerMode: controlledMode,
  onTimerModeChange,
}) => {
  const [internalMode, setInternalMode] = useState<'temporizador' | 'cronometro'>('temporizador');
  const activeMode = controlledMode ?? internalMode;

  const handleSwitchMode = (mode: 'temporizador' | 'cronometro') => {
    if (onTimerModeChange) {
      onTimerModeChange(mode);
    } else {
      setInternalMode(mode);
    }
  };

  // Laps / Parciales for Cronómetro mode
  const [laps, setLaps] = useState<{ id: number; time: string; delta: string }[]>([]);
  const [lastLapSec, setLastLapSec] = useState<number>(0);
  const [hundredths, setHundredths] = useState<number>(0);

  useEffect(() => {
    if (status === 'idle' && elapsedSeconds === 0) {
      setLaps([]);
      setLastLapSec(0);
    }
  }, [status, elapsedSeconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'running' || status === 'overtime') {
      interval = setInterval(() => {
        setHundredths((prev) => (prev + 4) % 100);
      }, 40);
    } else {
      setHundredths(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const isOvertime = status === 'overtime';
  const isStopwatch = activeMode === 'cronometro';

  // Primary displayed seconds:
  // - Temporizador: counts down remainingSeconds (or counts up overtimeSeconds when expired)
  // - Cronómetro: counts up elapsedSeconds from 00:00 continuously
  const displaySec = isStopwatch
    ? elapsedSeconds
    : isOvertime
    ? overtimeSeconds
    : remainingSeconds;

  const { minutes, seconds } = formatSecondsToDigital(displaySec);
  const { minutes: remMin, seconds: remSec } = formatSecondsToDigital(
    isOvertime ? overtimeSeconds : remainingSeconds
  );

  const handleRecordLap = () => {
    const safeElapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
    const splitDelta = Math.max(0, safeElapsed - lastLapSec);
    const { minutes: dm, seconds: ds } = formatSecondsToDigital(splitDelta);
    const timeStr = `${minutes}:${seconds}.${String(hundredths).padStart(2, '0')}`;
    const deltaStr = `+${dm}:${ds}`;

    setLaps((prev) => [
      {
        id: prev.length + 1,
        time: timeStr,
        delta: deltaStr,
      },
      ...prev.slice(0, 9),
    ]);
    setLastLapSec(safeElapsed);
  };

  // Status message and subtle visual phase
  let phaseColor = 'text-blue-400 border-blue-500/20 bg-blue-950/20';
  let phaseText = isStopwatch ? 'Cronómetro listo (00:00 ↑)' : 'Temporizador listo';
  let PhaseIcon = isStopwatch ? Timer : Clock;

  if (status === 'running' || status === 'paused') {
    if (remainingSeconds <= 30) {
      phaseColor = 'text-amber-400 border-amber-500/30 bg-amber-950/30';
      phaseText = isStopwatch
        ? 'Cronómetro activo · Cierre final (≤ 30s para meta)'
        : 'Tramo de cierre final (≤ 30s)';
      PhaseIcon = AlertCircle;
    } else if (remainingSeconds <= 60) {
      phaseColor = 'text-yellow-300 border-yellow-500/20 bg-yellow-950/20';
      phaseText = isStopwatch ? 'Cronómetro activo · Último minuto de meta' : 'Último minuto';
      PhaseIcon = AlertCircle;
    } else if (remainingSeconds <= targetSeconds / 2) {
      phaseColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
      phaseText = isStopwatch ? 'Cronómetro en marcha · 2.ª mitad' : 'Segunda mitad del discurso';
      PhaseIcon = CheckCircle2;
    } else {
      phaseColor = isStopwatch
        ? 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20'
        : 'text-blue-400 border-blue-500/20 bg-blue-950/20';
      phaseText = isStopwatch ? 'Cronómetro progresivo en marcha' : 'En ritmo regular';
      PhaseIcon = isStopwatch ? Timer : Clock;
    }
  } else if (isOvertime) {
    phaseColor = 'text-rose-400 border-rose-500/40 bg-rose-950/40 animate-pulse';
    phaseText = isStopwatch
      ? `Meta de ${formatHumanTime(targetSeconds)} superada (+${remMin}:${remSec})`
      : 'Tiempo límite excedido (tiempo extra)';
    PhaseIcon = AlertCircle;
  }

  // Circular gauge values
  const strokeRadius = isCompact ? 100 : 120;
  const circumference = 2 * Math.PI * strokeRadius;
  const safeProgress = Number.isFinite(progressPercent) ? progressPercent : 0;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center relative w-full ${isCompact ? 'py-1 sm:py-2' : 'py-5'}`}>
      {/* Mode Switcher: Temporizador (Cuenta regresiva) vs Cronómetro (Progresivo 00:00 ↑) */}
      <div className={`inline-flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl shadow-inner ${isCompact ? 'mb-2' : 'mb-3.5'}`}>
        <button
          type="button"
          onClick={() => handleSwitchMode('temporizador')}
          className={`flex items-center gap-1.5 rounded-lg font-semibold transition-all ${
            isCompact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
          } ${
            !isStopwatch
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Temporizador de cuenta regresiva hacia cero"
        >
          <Hourglass className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>Temporizador</span>
          {!isCompact && <span className="text-[10px] opacity-80 font-normal">(↓ Regresivo)</span>}
        </button>

        <button
          type="button"
          onClick={() => handleSwitchMode('cronometro')}
          className={`flex items-center gap-1.5 rounded-lg font-semibold transition-all ${
            isCompact ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
          } ${
            isStopwatch
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Cronómetro progresivo desde 00:00 hacia adelante"
        >
          <Timer className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>Cronómetro</span>
          {!isCompact && <span className="text-[10px] opacity-80 font-normal">(↑ 00:00)</span>}
        </button>
      </div>

      {/* Phase Indicator Badge */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-300 ${
          isCompact ? 'px-2.5 py-0.5 text-[11px] mb-1.5' : 'px-3.5 py-1 text-xs mb-3'
        } ${phaseColor}`}
      >
        <PhaseIcon className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{phaseText}</span>
        {status === 'paused' && (
          <span className="text-neutral-400 text-[10px] font-normal">· Pausado</span>
        )}
      </div>

      {/* Main Circular & Numeric Display */}
      <div className="relative flex items-center justify-center my-1">
        {/* SVG Circular Ring Gauge */}
        <div
          className={`relative flex items-center justify-center transition-all ${
            isCompact ? 'w-44 h-44 sm:w-48 sm:h-48' : 'w-64 h-64 sm:w-72 sm:h-72 my-1'
          }`}
        >
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
            {/* Background Track */}
            <circle
              cx="140"
              cy="140"
              r={strokeRadius}
              className="text-neutral-800/80 stroke-current"
              strokeWidth={isCompact ? '9' : '10'}
              fill="transparent"
            />
            {/* Active Gauge */}
            <circle
              cx="140"
              cy="140"
              r={strokeRadius}
              className={`stroke-current transition-all duration-300 ${
                isOvertime
                  ? 'text-rose-500'
                  : remainingSeconds <= 30
                  ? 'text-amber-500'
                  : remainingSeconds <= 60
                  ? 'text-yellow-400'
                  : isStopwatch
                  ? 'text-emerald-500'
                  : 'text-blue-500'
              }`}
              strokeWidth={isCompact ? '10' : '12'}
              strokeDasharray={circumference}
              strokeDashoffset={isOvertime ? 0 : strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Centered Digital Numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none px-4">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                isOvertime && !isStopwatch
                  ? 'text-rose-400'
                  : isStopwatch
                  ? 'text-emerald-400'
                  : 'text-blue-400/80'
              }`}
            >
              {isStopwatch
                ? 'Tiempo Transcurrido'
                : isOvertime
                ? 'Tiempo Extra'
                : 'Tiempo Restante'}
            </span>

            <div
              className={`font-mono tabular-nums tracking-tighter leading-none font-bold transition-all flex items-baseline justify-center ${
                isOvertime && !isStopwatch
                  ? 'text-rose-400'
                  : isOvertime && isStopwatch
                  ? 'text-amber-300'
                  : 'text-neutral-50'
              } ${isCompact ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl'}`}
            >
              {!isStopwatch && isOvertime && '+'}
              <span>
                {minutes}:{seconds}
              </span>
              {isStopwatch && (
                <span className={`${isCompact ? 'text-base' : 'text-xl sm:text-2xl'} text-emerald-400/90 font-semibold ml-0.5`}>
                  .{String(hundredths).padStart(2, '0')}
                </span>
              )}
            </div>

            <div
              className={`text-neutral-400 flex items-center gap-1.5 ${
                isCompact ? 'text-[11px] mt-1' : 'text-xs mt-2 gap-2'
              }`}
            >
              {isStopwatch ? (
                <>
                  <span>
                    {isOvertime ? `Excedido: +${remMin}:${remSec}` : `Restan: ${remMin}:${remSec}`}
                  </span>
                  <span>·</span>
                  <span>Meta: {formatHumanTime(targetSeconds)}</span>
                </>
              ) : (
                <>
                  <span>Objetivo: {formatHumanTime(targetSeconds)}</span>
                  <span>·</span>
                  <span>{Math.round(safeProgress)}%</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Time Micro-Adjusters + Stopwatch Lap/Parcial Button */}
      <div className={`flex flex-wrap items-center justify-center ${isCompact ? 'gap-2 mt-2 text-[11px]' : 'gap-3 mt-3 text-xs'}`}>
        <button
          type="button"
          onClick={() => onAddSeconds(-30)}
          className={`flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors ${
            isCompact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Restar 30 segundos a la meta"
        >
          <Minus className="w-3 h-3" />
          <span>30s</span>
        </button>

        {isStopwatch ? (
          <button
            type="button"
            onClick={handleRecordLap}
            disabled={status === 'idle' && elapsedSeconds === 0}
            className={`flex items-center gap-1.5 font-medium rounded-lg border transition-all ${
              isCompact ? 'px-2.5 py-1' : 'px-3.5 py-1.5'
            } ${
              status !== 'idle' || elapsedSeconds > 0
                ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 active:scale-95'
                : 'bg-neutral-900/40 text-neutral-600 border-neutral-800/60 cursor-not-allowed'
            }`}
            title="Marcar tiempo parcial o vuelta de sección"
          >
            <Flag className="w-3 h-3" />
            <span>Marcar Parcial</span>
          </button>
        ) : (
          <span className="text-neutral-400 font-mono text-center px-1">
            Transcurrido: <strong className="text-neutral-200 font-mono">{formatHumanTime(elapsedSeconds)}</strong>
          </span>
        )}

        <button
          type="button"
          onClick={() => onAddSeconds(30)}
          className={`flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors ${
            isCompact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Añadir 30 segundos a la meta"
        >
          <Plus className="w-3 h-3" />
          <span>30s</span>
        </button>
      </div>

      {/* Recorded Laps / Parciales List when in Cronómetro mode */}
      {isStopwatch && laps.length > 0 && (
        <div className="w-full max-w-xs mt-3 bg-neutral-950/90 border border-neutral-800/80 rounded-xl p-2.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800 text-[11px] text-neutral-400">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Parciales del Cronómetro ({laps.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setLaps([]);
                setLastLapSec(0);
              }}
              className="text-neutral-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-[10px]"
              title="Limpiar parciales"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[11px]">
            {laps.map((lap) => (
              <div
                key={lap.id}
                className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900/70 text-neutral-300"
              >
                <span className="text-neutral-400">Parcial #{lap.id}</span>
                <span className="text-emerald-400/90">{lap.delta}</span>
                <span className="font-bold text-white">{lap.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
