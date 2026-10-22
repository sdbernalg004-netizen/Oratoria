import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ShieldCheck,
  Lock,
  ExternalLink,
  Sparkles,
  Users,
  Globe,
  X,
} from 'lucide-react';

interface JwAffiliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: boolean | null;
  onSelectAffiliation: (isJw: boolean) => void;
  isFirstTimePrompt?: boolean;
}

export const JwAffiliationModal: React.FC<JwAffiliationModalProps> = ({
  isOpen,
  onClose,
  currentValue,
  onSelectAffiliation,
  isFirstTimePrompt = false,
}) => {
  const [selected, setSelected] = useState<boolean>(currentValue ?? true);

  if (!isOpen) return null;

  const handleSave = () => {
    onSelectAffiliation(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Personaliza tu Enfoque de Oratoria</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Elige el manual y fuente de consejos para tus ensayos con IA
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
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">¿Eres Testigo de Jehová?</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Adaptamos el análisis del entrenador para que evalúe las lecciones oratorias y de enseñanza exactas que necesitas.
            </p>
          </div>

          {/* Option 1: Yes, Jehovah's Witness */}
          <div
            onClick={() => setSelected(true)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selected === true
                ? 'bg-blue-950/40 border-blue-500/80 shadow-lg ring-1 ring-blue-500/40'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
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
                      Libro Benefíciese (JW.ORG)
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Tus consejos de oratoria se fundamentarán en las <strong>53 lecciones</strong> del libro:{' '}
                    <em>«Benefíciese de la Escuela del Ministerio Teocrático»</em> (lectura con precisión, modulación, pausas oportunas, énfasis debido, contacto visual, uso eficaz de textos bíblicos, etc.).
                  </p>

                  <a
                    href="https://www.jw.org/es/biblioteca/libros/Benef%C3%ADciese-de-la-Escuela-del-Ministerio-Teocr%C3%A1tico/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 underline font-medium pt-1"
                  >
                    <span>Ver libro en jw.org</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: No / General Oratory */}
          <div
            onClick={() => setSelected(false)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selected === false
                ? 'bg-blue-950/40 border-blue-500/80 shadow-lg ring-1 ring-blue-500/40'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
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
                      Técnicas Universales
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Consejos basados en oratoria profesional pública, conferencias de estilo Toastmasters International, retórica clásica y elocuencia contemporánea.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Strict Privacy Guarantee Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantía de Privacidad y Confidencialidad Absoluta</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Toda la información, bosquejos y notas de JW son de <strong>uso estrictamente personal</strong> para quien los suba. Están encriptados y protegidos por reglas de seguridad en tu cuenta personal; ningún archivo ni transcripción se comparte, filtra ni hace público jamás.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-neutral-800 bg-neutral-950/70">
          <span className="text-[11px] text-neutral-500">
            Puedes cambiar este ajuste en cualquier momento desde tu cuenta
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-900/30 active:scale-95"
            >
              Confirmar y Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
