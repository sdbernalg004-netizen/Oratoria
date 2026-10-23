import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Check,
  ShieldCheck,
  Lock,
  ExternalLink,
  AlertTriangle,
  FileCheck2,
  X,
} from 'lucide-react';

interface JwAffiliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: boolean | null;
  isVerified?: boolean;
  onSelectAffiliation: (isJw: boolean, verified: boolean) => void;
  isFirstTimePrompt?: boolean;
}

export const JwAffiliationModal: React.FC<JwAffiliationModalProps> = ({
  isOpen,
  onClose,
  currentValue,
  isVerified = false,
  onSelectAffiliation,
  isFirstTimePrompt = false,
}) => {
  const [selected, setSelected] = useState<boolean>(currentValue ?? true);

  // Verification Question 1: Name of the weekly meeting / school
  const [answerMeeting, setAnswerMeeting] = useState<string>(isVerified ? 'vym' : '');
  // Verification Question 2: Number of counsel points in the Benefíciese book
  const [answerLessons, setAnswerLessons] = useState<string>(isVerified ? '53' : '');

  // Mandatory Copyright & Proper Use Checkboxes
  const [acceptedCopyrightPolicy, setAcceptedCopyrightPolicy] = useState<boolean>(isVerified);
  const [acceptedPersonalProperUse, setAcceptedPersonalProperUse] = useState<boolean>(isVerified);

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(currentValue ?? true);
      if (isVerified && currentValue === true) {
        setAnswerMeeting('vym');
        setAnswerLessons('53');
        setAcceptedCopyrightPolicy(true);
        setAcceptedPersonalProperUse(true);
      }
      setValidationError(null);
    }
  }, [isOpen, currentValue, isVerified]);

  if (!isOpen) return null;

  const isQuizCorrect = answerMeeting === 'vym' && answerLessons === '53';
  const areTermsAccepted = acceptedCopyrightPolicy && acceptedPersonalProperUse;
  const canConfirmJw = isQuizCorrect && areTermsAccepted;

  const handleSave = () => {
    setValidationError(null);

    if (selected === true) {
      if (!answerMeeting || !answerLessons) {
        setValidationError(
          'Por favor, responde las 2 preguntas de verificación de contexto teocrático para continuar.'
        );
        return;
      }
      if (!isQuizCorrect) {
        setValidationError(
          'Alguna de las respuestas de verificación no coincide con el manual «Benefíciese». Revisa tus respuestas o elige Oratoria General.'
        );
        return;
      }
      if (!areTermsAccepted) {
        setValidationError(
          'Debes marcar las dos casillas de respeto a los derechos de autor de jw.org y compromiso de uso debido.'
        );
        return;
      }
      onSelectAffiliation(true, true);
      onClose();
    } else {
      onSelectAffiliation(false, false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Control de Afiliación, Uso Debido y Derechos de Autor</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Configuración verificada del enfoque de consejos de oratoria y protección de propiedad intelectual
              </p>
            </div>
          </div>

          {!isFirstTimePrompt && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">
              1. ¿Eres Testigo de Jehová y deseas evaluar tus discursos según el método de la escuela teocrática?
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Para garantizar un uso debido y respetar rigurosamente los derechos de autor de{' '}
              <strong className="text-neutral-200">jw.org</strong>, activamos este enfoque únicamente tras verificar el contexto de estudio y el compromiso de uso personal.
            </p>
          </div>

          {/* Option 1: Yes, Jehovah's Witness */}
          <div
            onClick={() => {
              setSelected(true);
              setValidationError(null);
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selected === true
                ? 'bg-blue-950/35 border-blue-500/80 shadow-lg ring-1 ring-blue-500/40'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                    selected === true
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                >
                  {selected === true && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">Sí, soy Testigo de Jehová</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-semibold border border-blue-700/50">
                      Guía de 53 Aspectos · Libro Benefíciese
                    </span>
                    {isVerified && currentValue === true && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-semibold border border-emerald-700/50 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    El entrenador generará recomendaciones originales orientadas a los principios de oratoria de{' '}
                    <em>«Benefíciese de la Escuela del Ministerio Teocrático»</em>, sin reproducir textos protegidos y dirigiendo siempre a la publicación oficial en{' '}
                    <strong className="text-white">jw.org</strong>.
                  </p>

                  <a
                    href="https://www.jw.org/es/biblioteca/libros/Benef%C3%ADciese-de-la-Escuela-del-Ministerio-Teocr%C3%A1tico/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 underline font-medium pt-0.5"
                  >
                    <span>Consultar libro oficial directamente en jw.org</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Strict Verification & Copyright Compliance Section when "Yes" is selected */}
          {selected === true && (
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. Verificación Exacta de Estudiante y Uso Debido</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Requerido por seguridad</span>
              </div>

              {/* Question 1 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-200">
                  A. ¿En qué reunión semanal se presentan las asignaciones estudiantiles basadas en estos principios de lectura y enseñanza?
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    {
                      id: 'vym',
                      label:
                        'Reunión Vida y Ministerio Cristianos (anteriormente Escuela del Ministerio Teocrático)',
                    },
                    {
                      id: 'debate',
                      label: 'Foro Anual de Debate y Retórica Parlamentaria',
                    },
                    {
                      id: 'seminario',
                      label: 'Seminario Dominical de Locución Comercial',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        answerMeeting === opt.id
                          ? 'bg-blue-950/50 border-blue-500/60 text-white font-medium'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="jw_meeting_check"
                        checked={answerMeeting === opt.id}
                        onChange={() => {
                          setAnswerMeeting(opt.id);
                          setValidationError(null);
                        }}
                        className="accent-blue-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-200">
                  B. ¿Cuántos aspectos o lecciones numeradas de oratoria contiene la tabla de consejos del libro «Benefíciese»?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: '12', label: '12 capítulos generales' },
                    { id: '53', label: '53 aspectos de consejo' },
                    { id: '100', label: '100 reglas de debate' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        answerLessons === opt.id
                          ? 'bg-blue-950/50 border-blue-500/60 text-white font-medium'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="jw_lessons_check"
                        checked={answerLessons === opt.id}
                        onChange={() => {
                          setAnswerLessons(opt.id);
                          setValidationError(null);
                        }}
                        className="accent-blue-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Copyright & Proper Use Commitments */}
              <div className="pt-2 border-t border-neutral-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Declaración de Derechos de Autor (jw.org) y Uso Debido:</span>
                </div>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptedCopyrightPolicy}
                    onChange={(e) => {
                      setAcceptedCopyrightPolicy(e.target.checked);
                      setValidationError(null);
                    }}
                    className="mt-0.5 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0 w-4 h-4 shrink-0"
                  />
                  <span className="text-[11px] text-neutral-300 leading-relaxed">
                    <strong>Respeto a los Derechos de Autor de jw.org:</strong> Comprendo que esta aplicación es una herramienta técnica independiente de ensayo personal y{' '}
                    <strong>NO está afiliada ni patrocinada por Watch Tower Bible and Tract Society of Pennsylvania</strong>. Para no infringir los derechos de autor de jw.org, esta plataforma jamás copia, almacena ni distribuye el contenido textual del libro <em>«Benefíciese»</em>; únicamente ofrece retroalimentación original de voz y remite mediante enlace directo a{' '}
                    <span className="text-blue-400">jw.org</span> para leer la obra original.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptedPersonalProperUse}
                    onChange={(e) => {
                      setAcceptedPersonalProperUse(e.target.checked);
                      setValidationError(null);
                    }}
                    className="mt-0.5 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0 w-4 h-4 shrink-0"
                  />
                  <span className="text-[11px] text-neutral-300 leading-relaxed">
                    <strong>Compromiso de Uso Debido y Privacidad Estricta:</strong> Certifico que daré un uso debido, respetuoso y exclusivamente personal a mis notas y bosquejos, cumpliendo las Condiciones de Uso de jw.org y absteniéndome de publicar, redistribuir o compartir bosquejos confidenciales con terceros.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Option 2: No / General Oratory */}
          <div
            onClick={() => {
              setSelected(false);
              setValidationError(null);
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selected === false
                ? 'bg-blue-950/35 border-blue-500/80 shadow-lg ring-1 ring-blue-500/40'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                    selected === false
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                >
                  {selected === false && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">No / Prefiero Oratoria General</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-semibold border border-neutral-700">
                      Fuentes de la Red y Retórica Universal
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Los consejos de oratoria se tomarán de la red y de otras fuentes reconocidas de comunicación pública (Toastmasters International, conferencias TED, retórica clásica y expresión verbal profesional).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Strict Privacy Guarantee Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantía de Aislamiento y Uso Estrictamente Personal</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Tus bosquejos están aislados criptográficamente bajo tu identificador único (<code className="text-emerald-300">uid</code>). Ningún otro usuario puede ver, buscar ni acceder a tus documentos subidos.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-neutral-800 bg-neutral-950/80">
          <span className="text-[11px] text-neutral-500">
            {selected === true
              ? canConfirmJw
                ? '✓ Verificación y compromiso completados correctamente'
                : 'Completa la verificación y las 2 casillas para activar este modo'
              : 'Modo de Oratoria General listo para activar'}
          </span>

          <div className="flex items-center gap-2">
            {!isFirstTimePrompt && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl transition-all shadow-md active:scale-95 ${
                selected === false || canConfirmJw
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {selected === true ? 'Verificar y Confirmar' : 'Confirmar Oratoria General'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
