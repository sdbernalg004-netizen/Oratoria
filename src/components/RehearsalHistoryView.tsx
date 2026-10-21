import React, { useState, useEffect } from 'react';
import { RehearsalRecord } from '../types';
import { getAudioBlob, deleteAudioBlob } from '../utils/audioStorage';
import { formatHumanTime } from '../hooks/useSpeechTimer';
import {
  History,
  Trash2,
  Play,
  Pause,
  Download,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Volume2,
} from 'lucide-react';

interface RehearsalHistoryViewProps {
  records: RehearsalRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const RehearsalHistoryView: React.FC<RehearsalHistoryViewProps> = ({
  records,
  onDeleteRecord,
  onClearAll,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedAudioUrls, setLoadedAudioUrls] = useState<Record<string, string>>({});
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Load audio blobs for records that have audioStorageKey
  useEffect(() => {
    let isCancelled = false;

    records.forEach(async (rec) => {
      if (rec.audioStorageKey && !loadedAudioUrls[rec.id]) {
        try {
          const blob = await getAudioBlob(rec.audioStorageKey);
          if (blob && !isCancelled) {
            const url = URL.createObjectURL(blob);
            setLoadedAudioUrls((prev) => ({ ...prev, [rec.id]: url }));
          }
        } catch (e) {
          console.warn('Could not load audio blob for record:', rec.id, e);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [records, loadedAudioUrls]);

  const filtered = records.filter(
    (r) =>
      r.speechTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalTimeSeconds = records.reduce((acc, r) => acc + r.actualSeconds, 0);
  const onTimeCount = records.filter((r) => Math.abs(r.actualSeconds - r.targetSeconds) <= 20).length;
  const onTimeRate = records.length > 0 ? Math.round((onTimeCount / records.length) * 100) : 0;

  const handleDelete = async (rec: RehearsalRecord) => {
    if (rec.audioStorageKey) {
      await deleteAudioBlob(rec.audioStorageKey);
    }
    if (loadedAudioUrls[rec.id]) {
      URL.revokeObjectURL(loadedAudioUrls[rec.id]);
    }
    onDeleteRecord(rec.id);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Historial y Evolución de Ensayos</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Registro de tomas, tiempos logrados, grabaciones de voz y auto-evaluaciones
          </p>
        </div>

        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-neutral-400 hover:text-rose-400 transition-colors"
            >
              Borrar historial
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Volver al Atril
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
          <span className="block text-[11px] text-neutral-400">Total Ensayos Registrados</span>
          <span className="text-2xl font-bold text-white font-mono mt-0.5 block">
            {records.length}
          </span>
        </div>
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
          <span className="block text-[11px] text-neutral-400">Tiempo Acumulado de Práctica</span>
          <span className="text-2xl font-bold text-blue-400 font-mono mt-0.5 block">
            {formatHumanTime(totalTimeSeconds)}
          </span>
        </div>
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
          <span className="block text-[11px] text-neutral-400">Precisión en Rango (+/- 20s)</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
            {onTimeRate}%
          </span>
        </div>
      </div>

      {/* Search Input */}
      {records.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ensayos por título o notas..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Records List or Empty State */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
            <Clock className="w-10 h-10 text-neutral-600 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300">
              No hay ensayos registrados todavía
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">
              Inicia el cronómetro, ensaya tu discurso y al presionar "Finalizar Toma" quedará
              guardada tu grabación y tus notas de progreso.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Comenzar Primer Ensayo
            </button>
          </div>
        ) : (
          filtered.map((rec) => {
            const dateStr = new Date(rec.timestamp).toLocaleDateString(undefined, {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            const delta = rec.actualSeconds - rec.targetSeconds;
            const audioSrc = loadedAudioUrls[rec.id] || rec.audioBlobUrl;

            return (
              <div
                key={rec.id}
                className="p-4 bg-neutral-950/80 border border-neutral-800/80 rounded-xl transition-all hover:border-neutral-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-neutral-800/50">
                  <div>
                    <h4 className="text-sm font-bold text-white">{rec.speechTitle}</h4>
                    <span className="text-[11px] text-neutral-400">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {rec.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rec.rating! ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(rec)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Eliminar ensayo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Duration comparison */}
                <div className="flex flex-wrap items-center gap-4 py-2.5 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <span>Meta:</span>
                    <strong className="text-neutral-200">{formatHumanTime(rec.targetSeconds)}</strong>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Logrado:</span>
                    <strong
                      className={rec.isOvertime ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}
                    >
                      {formatHumanTime(rec.actualSeconds)}
                    </strong>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400">Diferencia:</span>
                    <span
                      className={`font-semibold ${
                        Math.abs(delta) <= 15
                          ? 'text-emerald-400'
                          : delta > 0
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {delta > 0 ? `+${delta}s` : `${delta}s`}
                    </span>
                  </div>
                </div>

                {/* Audio player if available */}
                {audioSrc && (
                  <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <audio controls src={audioSrc} className="w-full h-8 rounded" />
                  </div>
                )}

                {/* Notes */}
                {rec.notes && (
                  <div className="mt-2 pt-2 border-t border-neutral-900 text-xs text-neutral-300 italic bg-neutral-900/40 p-2.5 rounded-lg">
                    "{rec.notes}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
