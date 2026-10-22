import React from 'react';
import { TimerStatus, formatSecondsToDigital, formatHumanTime } from '../hooks/useSpeechTimer';
import { Plus, Minus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface TimerDisplayProps {
  remainingSeconds: number;
  overtimeSeconds: number;
  targetSeconds: number;
  elapsedSeconds: number;
  status: TimerStatus;
  progressPercent: number;
  onAddSeconds: (delta: number) => void;
  isCompact?: boolean;
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
}) => {
  const isOvertime = status === 'overtime';
  const displaySec = isOvertime ? overtimeSeconds : remainingSeconds;
  const { minutes, seconds } = formatSecondsToDigital(displaySec);

  // Status message and subtle visual phase
  let phaseColor = 'text-blue-400 border-blue-500/20 bg-blue-950/20';
  let phaseText = 'Listo para ensayar';
  let PhaseIcon = Clock;

  if (status === 'running' || status === 'paused') {
    if (remainingSeconds <= 30) {
      phaseColor = 'text-amber-400 border-amber-500/30 bg-amber-950/30';
      phaseText = 'Tramo de cierre final (≤ 30s)';
      PhaseIcon = AlertCircle;
    } else if (remainingSeconds <= 60) {
      phaseColor = 'text-yellow-300 border-yellow-500/20 bg-yellow-950/20';
      phaseText = 'Último minuto';
      PhaseIcon = AlertCircle;
    } else if (remainingSeconds <= targetSeconds / 2) {
      phaseColor = 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20';
      phaseText = 'Segunda mitad del discurso';
      PhaseIcon = CheckCircle2;
    } else {
      phaseColor = 'text-blue-400 border-blue-500/20 bg-blue-950/20';
      phaseText = 'En ritmo regular';
      PhaseIcon = Clock;
    }
  } else if (isOvertime) {
    phaseColor = 'text-rose-400 border-rose-500/40 bg-rose-950/40 animate-pulse';
    phaseText = 'Tiempo límite excedido (tiempo extra)';
    PhaseIcon = AlertCircle;
  }

  // Circular gauge values
  const strokeRadius = isCompact ? 100 : 120;
  const circumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center relative w-full ${isCompact ? 'py-1 sm:py-2' : 'py-8'}`}>
      {/* Phase Indicator Badge */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-300 ${
          isCompact ? 'px-2.5 py-0.5 text-[11px] mb-2' : 'px-3.5 py-1 text-xs mb-4'
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
        <div className={`relative flex items-center justify-center transition-all ${
          isCompact ? 'w-44 h-44 sm:w-48 sm:h-48' : 'w-64 h-64 sm:w-72 sm:h-72 my-2'
        }`}>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            {isOvertime && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 mb-0.5">
                Tiempo Extra
              </span>
            )}
            <div
              className={`font-mono tabular-nums tracking-tighter leading-none font-bold text-white transition-all ${
                isOvertime ? 'text-rose-400' : 'text-neutral-50'
              } ${isCompact ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl md:text-8xl'}`}
            >
              {isOvertime && '+'}
              {minutes}:{seconds}
            </div>

            <div className={`text-neutral-400 flex items-center gap-1.5 ${isCompact ? 'text-[11px] mt-1' : 'text-xs mt-2 gap-2'}`}>
              <span>Objetivo: {formatHumanTime(targetSeconds)}</span>
              <span>·</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Time Micro-Adjusters */}
      <div className={`flex items-center ${isCompact ? 'gap-2 mt-2 text-[11px]' : 'gap-3 mt-4 text-xs'}`}>
        <button
          onClick={() => onAddSeconds(-30)}
          className={`flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors ${
            isCompact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Restar 30 segundos"
        >
          <Minus className="w-3 h-3" />
          <span>30s</span>
        </button>

        <span className="text-neutral-400 font-mono text-center">
          <strong className="text-neutral-300 font-mono">{formatHumanTime(elapsedSeconds)}</strong>
        </span>

        <button
          onClick={() => onAddSeconds(30)}
          className={`flex items-center gap-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors ${
            isCompact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
          title="Añadir 30 segundos"
        >
          <Plus className="w-3 h-3" />
          <span>30s</span>
        </button>
      </div>
    </div>
  );
};
