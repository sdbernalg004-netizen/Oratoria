import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GripHorizontal,
  X,
  Minimize2,
  Maximize2,
  Sliders,
  RotateCcw,
  Volume2,
  Flag,
  ChevronDown,
  Eye,
  CornerDownLeft,
  CornerDownRight,
  LayoutGrid,
} from 'lucide-react';
import { TimerStatus } from '../hooks/useSpeechTimer';

interface FloatingAdaptableTimerProps {
  status: TimerStatus;
  remainingSeconds: number;
  overtimeSeconds: number;
  targetSeconds: number;
  elapsedSeconds: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onFinishRehearsal: () => void;
  onOpenSoundModal?: () => void;
  isRecording?: boolean;
  onDockToSide?: () => void;
  timerMode?: 'temporizador' | 'cronometro';
  onTimerModeChange?: (mode: 'temporizador' | 'cronometro') => void;
}

export const FloatingAdaptableTimer: React.FC<FloatingAdaptableTimerProps> = ({
  status,
  remainingSeconds,
  overtimeSeconds,
  targetSeconds,
  elapsedSeconds,
  onToggleTimer,
  onResetTimer,
  onFinishRehearsal,
  onOpenSoundModal,
  isRecording = false,
  onDockToSide,
  timerMode: controlledMode,
  onTimerModeChange,
}) => {
  // Mode: 'cronometro' (count-up stopwatch) or 'temporizador' (countdown timer)
  const [internalTimerMode, setInternalTimerMode] = useState<'cronometro' | 'temporizador'>('temporizador');
  const timerMode = controlledMode ?? internalTimerMode;

  const handleSetTimerMode = (mode: 'cronometro' | 'temporizador') => {
    if (onTimerModeChange) {
      onTimerModeChange(mode);
    } else {
      setInternalTimerMode(mode);
    }
  };

  // Laps / Parciales list
  const [laps, setLaps] = useState<{ id: number; time: string; label: string }[]>([]);

  // Position state (draggable)
  // Default to bottom-left matching user's uploaded screenshot!
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Initial placement at bottom-left
    const initialY = typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 250) : 400;
    return { x: 20, y: initialY };
  });

  // State: expanded, standard, compact-pill, or hidden
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isLapsExpanded, setIsLapsExpanded] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(0.95); // 0.4 to 1
  const [showOpacitySlider, setShowOpacitySlider] = useState<boolean>(false);

  // Dragging logic
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hundredths tick simulation for ultra-crisp digital stopwatch look
  const [hundredths, setHundredths] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'running' || status === 'overtime') {
      interval = setInterval(() => {
        setHundredths((prev) => (prev + 4) % 100);
      }, 40);
    } else {
      setHundredths(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header handle
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      const touch = e.touches[0];
      dragOffsetRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 240, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(60, Math.min(window.innerHeight - 120, e.clientY - dragOffsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const newX = Math.max(10, Math.min(window.innerWidth - 240, touch.clientX - dragOffsetRef.current.x));
      const newY = Math.max(60, Math.min(window.innerHeight - 120, touch.clientY - dragOffsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Quick snap positions
  const snapTo = (corner: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left') => {
    if (typeof window === 'undefined') return;
    const padding = 20;
    const width = 230;
    const height = 180;
    if (corner === 'bottom-left') {
      setPosition({ x: padding, y: window.innerHeight - height - 40 });
    } else if (corner === 'bottom-right') {
      setPosition({ x: window.innerWidth - width - padding, y: window.innerHeight - height - 40 });
    } else if (corner === 'top-right') {
      setPosition({ x: window.innerWidth - width - padding, y: 70 });
    } else if (corner === 'top-left') {
      setPosition({ x: padding, y: 70 });
    }
  };

  // Format digital values
  const isRunning = status === 'running' || status === 'overtime';
  const isOvertime = status === 'overtime';

  // Value depending on mode
  const rawSeconds =
    timerMode === 'temporizador'
      ? isOvertime
        ? overtimeSeconds
        : remainingSeconds
      : elapsedSeconds;

  const currentSeconds =
    typeof rawSeconds === 'number' && Number.isFinite(rawSeconds) ? Math.round(rawSeconds) : 0;

  const m = Math.floor(Math.abs(currentSeconds) / 60);
  const s = Math.abs(currentSeconds) % 60;
  const timeFormatted = `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  const handleAddLap = () => {
    setLaps((prev) => [
      {
        id: prev.length + 1,
        time: timeFormatted,
        label: `Vuelta ${prev.length + 1}`,
      },
      ...prev.slice(0, 7),
    ]);
  };

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        opacity,
      }}
      className="fixed top-0 left-0 z-40 select-none transition-opacity duration-150"
    >
      {isMinimized ? (
        /* Minimized Floating Pill */
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-950/90 text-white rounded-full border border-neutral-700/80 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing hover:border-neutral-500">
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex items-center gap-1 cursor-grab"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                isOvertime ? 'text-rose-400' : 'text-neutral-100'
              }`}
            >
              {isOvertime && '+'}
              {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={onToggleTimer}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isRunning ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isRunning ? '||' : '▶'}
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-neutral-400 hover:text-white"
            title="Maximizar cronómetro adaptable"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          {onDockToSide && (
            <button
              onClick={onDockToSide}
              className="p-1 text-neutral-400 hover:text-blue-400"
              title="Fijar cronómetro al panel lateral del atril"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        /* Standard Floating Widget (Exact UI structure as Samsung / Android floating timer in screenshot) */
        <div className="w-[210px] sm:w-[225px] bg-neutral-950/95 text-white rounded-2xl border border-neutral-700/80 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col font-sans">
          {/* Header Bar with Window Controls & Drag Grip */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800/80 cursor-grab active:cursor-grabbing text-neutral-400"
          >
            <div className="flex items-center gap-1">
              <GripHorizontal className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-300">
                {timerMode === 'temporizador' ? 'Temporizador' : 'Cronómetro'}
              </span>
            </div>

            {/* Top window controls */}
            <div className="flex items-center gap-1">
              {onDockToSide && (
                <button
                  onClick={onDockToSide}
                  className="p-1 text-neutral-400 hover:text-blue-400 transition-colors"
                  title="Fijar cronómetro al panel lateral del atril"
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => setShowOpacitySlider((prev) => !prev)}
                className="p-1 hover:text-white transition-colors"
                title="Ajustar transparencia / opacidad"
              >
                <Eye className="w-3 h-3 text-neutral-400" />
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:text-white transition-colors"
                title="Minimizar a píldora flotante"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => snapTo('bottom-left')}
                className="p-1 hover:text-white transition-colors"
                title="Alinear a esquina inferior izquierda"
              >
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Opacity Mini Slider */}
          {showOpacitySlider && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400">
              <span>Opacidad:</span>
              <input
                type="range"
                min="0.35"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-24 accent-blue-500 h-1 bg-neutral-800 rounded cursor-pointer"
              />
              <span className="font-mono text-[9px]">{Math.round(opacity * 100)}%</span>
            </div>
          )}

          {/* Time Display */}
          <div className="flex flex-col items-center justify-center py-3 px-2">
            {isOvertime && timerMode === 'temporizador' && (
              <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider mb-0.5">
                Tiempo Extra
              </span>
            )}
            <div
              className={`font-mono font-bold tracking-tight text-center tabular-nums text-2xl sm:text-[26px] ${
                isOvertime ? 'text-rose-400' : 'text-neutral-50'
              }`}
            >
              {isOvertime && timerMode === 'temporizador' && '+'}
              {timeFormatted}
            </div>

            {/* Quick Mode Switcher tab: Cronómetro | Temporizador */}
            <div className="flex items-center gap-1 mt-2 p-0.5 bg-neutral-900 rounded-lg border border-neutral-800 text-[10px]">
              <button
                onClick={() => handleSetTimerMode('temporizador')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  timerMode === 'temporizador'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Temporizador
              </button>
              <button
                onClick={() => handleSetTimerMode('cronometro')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  timerMode === 'cronometro'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Cronómetro
              </button>
            </div>
          </div>

          {/* Action Buttons (Matches the red "Det." pill and "Parcial" button from user screenshot) */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
            {/* Parcial / Lap button */}
            <button
              onClick={handleAddLap}
              className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors border border-neutral-700/60 active:scale-95 text-center"
            >
              Parcial
            </button>

            {/* Red Detener / Start Button */}
            <button
              onClick={onToggleTimer}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 text-center ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {isRunning ? 'Det.' : 'Iniciar'}
            </button>

            {/* Reset */}
            <button
              onClick={() => onResetTimer()}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors border border-neutral-700/60 active:scale-95"
              title="Reiniciar a cero (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Footer Bar: Finish & Laps toggle */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/60 border-t border-neutral-800 text-[10px] text-neutral-400">
            <button
              onClick={() => setIsLapsExpanded((prev) => !prev)}
              className="hover:text-neutral-200 flex items-center gap-1"
            >
              <Flag className="w-3 h-3" />
              <span>Vueltas ({laps.length})</span>
            </button>

            <button
              onClick={onFinishRehearsal}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Finalizar Toma
            </button>
          </div>

          {/* Laps List expanded if user records laps */}
          {isLapsExpanded && laps.length > 0 && (
            <div className="max-h-24 overflow-y-auto custom-scrollbar p-2 bg-neutral-950 border-t border-neutral-800 text-[10px] font-mono space-y-1">
              {laps.map((lap) => (
                <div key={lap.id} className="flex justify-between text-neutral-300">
                  <span>{lap.label}:</span>
                  <span className="font-bold">{lap.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
