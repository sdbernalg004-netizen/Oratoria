import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Download, Trash2, Volume2, FastForward } from 'lucide-react';
import { RecordedAudioResult } from '../hooks/useVoiceRecorder';

interface VoiceRecorderWidgetProps {
  isRecording: boolean;
  isPaused: boolean;
  micLevel: number; // 0 to 100
  hasPermission: boolean | null;
  errorMessage: string | null;
  autoRecordEnabled: boolean;
  onToggleAutoRecord: (val: boolean) => void;
  recordedAudio: RecordedAudioResult | null;
  onClearRecording: () => void;
  onManualRecordToggle: () => void;
  onRequestPermission: () => Promise<boolean>;
}

export const VoiceRecorderWidget: React.FC<VoiceRecorderWidgetProps> = ({
  isRecording,
  isPaused,
  micLevel,
  hasPermission,
  errorMessage,
  autoRecordEnabled,
  onToggleAutoRecord,
  recordedAudio,
  onClearRecording,
  onManualRecordToggle,
  onRequestPermission,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current && recordedAudio) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, recordedAudio]);

  const handleTogglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSpeedCycle = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const handleDownload = () => {
    if (!recordedAudio) return;
    const a = document.createElement('a');
    a.href = recordedAudio.url;
    a.download = `ensayo-oratoria-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
      {/* Header with Title and Auto-Record Switch */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isRecording
                ? 'bg-rose-500 animate-pulse'
                : recordedAudio
                ? 'bg-emerald-500'
                : 'bg-neutral-600'
            }`}
          />
          <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
            Grabadora de Voz para Autoevaluación
          </h4>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 select-none">
          <input
            type="checkbox"
            checked={autoRecordEnabled}
            onChange={(e) => onToggleAutoRecord(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-950 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Auto-grabar al iniciar cronómetro</span>
        </label>
      </div>

      {/* Permission / Status Row */}
      {hasPermission === false && (
        <div className="flex items-center justify-between p-3 mb-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <MicOff className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage || 'Permiso de micrófono no habilitado'}</span>
          </div>
          <button
            onClick={onRequestPermission}
            className="px-2.5 py-1 text-xs font-medium bg-rose-900 hover:bg-rose-800 text-white rounded transition-colors"
          >
            Permitir
          </button>
        </div>
      )}

      {/* Active Recording State with VU Meter */}
      {isRecording && (
        <div className="flex flex-col gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span>{isPaused ? 'Grabación pausada' : 'Grabando voz del ensayo...'}</span>
            </div>
            <span className="text-neutral-400 font-mono text-xs">Nivel: {micLevel}%</span>
          </div>

          {/* VU Meter Visualizer Bars */}
          <div className="flex items-end gap-1 h-8 w-full bg-neutral-900/80 p-1.5 rounded-lg overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => {
              // Simulated reactive bar height based on micLevel and frequency spread
              const threshold = (i / 24) * 100;
              const isActive = micLevel >= threshold;
              const barHeightPercent = isActive
                ? Math.min(100, Math.max(20, micLevel * (0.8 + 0.4 * Math.sin(i * 0.7))))
                : 12;

              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-75"
                  style={{
                    height: `${barHeightPercent}%`,
                    backgroundColor:
                      i > 18
                        ? isActive
                          ? '#ef4444'
                          : '#450a0a'
                        : i > 12
                        ? isActive
                          ? '#f59e0b'
                          : '#451a03'
                        : isActive
                        ? '#10b981'
                        : '#064e3b',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Audio Player for Rehearsal Review */}
      {recordedAudio && !isRecording && (
        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="text-white font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Toma grabada ({recordedAudio.duration}s)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeedCycle}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors"
                title="Cambiar velocidad de reproducción"
              >
                {playbackSpeed}x
              </button>
              <button
                onClick={handleDownload}
                className="p-1 hover:text-white transition-colors"
                title="Descargar audio WebM"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearRecording}
                className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                title="Descartar toma"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={recordedAudio.url}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration || recordedAudio.duration);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          {/* Player controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlayback}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Scrubber slider */}
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min="0"
                max={duration || recordedAudio.duration}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) {
                    audioRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>{Math.floor(currentTime)}s</span>
                <span>{Math.floor(duration || recordedAudio.duration)}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Record Trigger fallback if auto-record is off */}
      {!isRecording && !recordedAudio && (
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
          <span>Micrófono preparado para registrar tu ensayo.</span>
          <button
            onClick={onManualRecordToggle}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-medium transition-colors"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Grabar Ahora</span>
          </button>
        </div>
      )}
    </div>
  );
};
