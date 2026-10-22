import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowModal(true);
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30 rounded-lg shadow-sm transition-all shrink-0 hover:shadow-blue-500/20"
        title="Instalar OratoriaPro en tu teléfono o dispositivo móvil"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {/* Installation Guide Modal (Active for iOS, Desktop to Mobile, or when prompt needs guidance) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Instalar en tu Teléfono</h3>
                <p className="text-xs text-neutral-400">PWA rápida, sin descargas de tienda</p>
              </div>
            </div>

            {isIOS ? (
              /* Guía específica para iPhone / iPad en Safari */
              <div className="space-y-3.5 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                <p className="font-semibold text-blue-300">Pasos para iPhone y iPad (Safari):</p>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[11px] border border-blue-500/30">
                    1
                  </div>
                  <div>
                    En la barra inferior de Safari, pulsa el botón <strong>Compartir</strong> (
                    <Share className="inline w-3.5 h-3.5 text-blue-400 mx-1" />
                    icono con flecha hacia arriba).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[11px] border border-blue-500/30">
                    2
                  </div>
                  <div>
                    Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong> (
                    <PlusSquare className="inline w-3.5 h-3.5 text-emerald-400 mx-1" />
                    o "Añadir a inicio").
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[11px] border border-blue-500/30">
                    3
                  </div>
                  <div>
                    Pulsa <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! Se abrirá como app nativa a pantalla completa.
                  </div>
                </div>
              </div>
            ) : (
              /* Guía para Android o Escritorio hacia Teléfono */
              <div className="space-y-4">
                {isInstallable && (
                  <button
                    onClick={() => {
                      install();
                      setShowModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar directamente ahora</span>
                  </button>
                )}

                <div className="p-4 bg-neutral-950/70 rounded-xl border border-neutral-800 text-xs space-y-3">
                  <p className="font-semibold text-neutral-200">
                    Para instalar en tu teléfono Android (Chrome):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                    <li>Abre este enlace en Google Chrome en tu celular.</li>
                    <li>Toca los tres puntos (⋮) en la esquina superior derecha.</li>
                    <li>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal".</li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <p className="text-[11px] text-neutral-400 mb-2">Enlace de la app para abrir en tu teléfono:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-300 select-all truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg border border-neutral-700 flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <span>Copiar</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
