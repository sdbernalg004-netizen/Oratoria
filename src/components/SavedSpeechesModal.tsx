import React, { useState } from 'react';
import { X, Cloud, CloudOff, FileText, Trash2, Play, Plus, Clock, ListChecks, CheckCircle, Upload } from 'lucide-react';
import { SpeechDraft, SourceDocument } from '../types';
import { useAuth } from '../context/AuthContext';

interface SavedSpeechesModalProps {
  isOpen: boolean;
  onClose: () => void;
  speeches: SpeechDraft[];
  activeSpeechId: string;
  onSelectSpeech: (speechId: string) => void;
  onDeleteSpeech: (speechId: string) => void;
  onOpenUpload: () => void;
}

export const SavedSpeechesModal: React.FC<SavedSpeechesModalProps> = ({
  isOpen,
  onClose,
  speeches,
  activeSpeechId,
  onSelectSpeech,
  onDeleteSpeech,
  onOpenUpload,
}) => {
  const { user, signIn } = useAuth();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Mis Bosquejos & Discursos</h3>
                {user ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cloud className="w-3 h-3" /> Nube activa
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <CloudOff className="w-3 h-3" /> Modo local
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                {user
                  ? 'Tus bosquejos subidos y estructurados están sincronizados con tu cuenta'
                  : 'Inicia sesión para que tus bosquejos se guarden permanentemente en tu cuenta'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Login Callout Banner if not logged in */}
        {!user && (
          <div className="mx-6 mt-4 p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between gap-4">
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-blue-300">¿Quieres guardar tus bosquejos para siempre?</span>
              <p className="text-neutral-400 mt-0.5">
                Inicia sesión con Google para acceder a tus discursos y documentos desde cualquier dispositivo.
              </p>
            </div>
            <button
              onClick={signIn}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        )}

        {/* Speeches List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {speeches.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-xl">
              <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-neutral-300">No tienes bosquejos guardados aún</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Sube un archivo PDF o Word (.docx) o redacta tu discurso para que se guarde automáticamente.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir PDF o Word</span>
              </button>
            </div>
          ) : (
            speeches.map((sp) => {
              const isActive = sp.id === activeSpeechId;
              const isConfirming = confirmDeleteId === sp.id;
              const sectionCount = sp.sections?.length || 0;
              const minutes = Math.round(sp.targetSeconds / 60);

              return (
                <div
                  key={sp.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/20'
                      : 'bg-neutral-950/50 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-white truncate max-w-md">{sp.title}</h4>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            <CheckCircle className="w-3 h-3" /> En Atril
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                          {sp.topic || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          {minutes} min objetivo
                        </span>
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5 text-neutral-500" />
                          {sectionCount} {sectionCount === 1 ? 'sección' : 'secciones con puntos clave'}
                        </span>
                      </div>

                      {sp.sections && sp.sections.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-neutral-400">
                          {sp.sections.slice(0, 3).map((s, idx) => (
                            <span
                              key={s.id || idx}
                              className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md truncate max-w-[160px]"
                            >
                              {s.title}
                            </span>
                          ))}
                          {sp.sections.length > 3 && (
                            <span className="text-neutral-500 text-[10px]">+{sp.sections.length - 3} más</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSelectSpeech(sp.id);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors shadow"
                          title="Cargar este bosquejo en el atril y cronómetro"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Cargar</span>
                        </button>
                      )}

                      {isConfirming ? (
                        <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/40 rounded-lg p-1">
                          <span className="text-[10px] text-red-300 px-1">¿Eliminar?</span>
                          <button
                            onClick={() => {
                              onDeleteSpeech(sp.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold rounded transition-colors"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[11px]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(sp.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Eliminar bosquejo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between gap-4">
          <span className="text-xs text-neutral-400">
            Total: {speeches.length} {speeches.length === 1 ? 'bosquejo' : 'bosquejos'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir nuevo PDF / Word</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
