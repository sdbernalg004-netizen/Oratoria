import React from 'react';
import { SoundAlertSettings } from '../types';
import { playChime, ChimeType } from '../utils/soundSynthesizer';
import { X, Volume2, VolumeX, Bell, Play } from 'lucide-react';

interface SoundAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SoundAlertSettings;
  onUpdateSettings: (newSettings: SoundAlertSettings) => void;
}

export const SoundAlertsModal: React.FC<SoundAlertsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleTest = (type: ChimeType) => {
    playChime(type, settings.volume);
  };

  const handleToggle = (key: keyof SoundAlertSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const alertItems: {
    key: keyof SoundAlertSettings;
    title: string;
    description: string;
    chimeType: ChimeType;
  }[] = [
    {
      key: 'halfwayAlert',
      title: 'Aviso al 50% del tiempo',
      description: 'Campana armónica ascendente suave que indica que llegaste a la mitad del discurso.',
      chimeType: 'halfway',
    },
    {
      key: 'oneMinuteAlert',
      title: 'Aviso de 1 minuto restante',
      description: 'Tono ámbar para iniciar la transición hacia tu conclusión.',
      chimeType: 'oneMinute',
    },
    {
      key: 'thirtySecondsAlert',
      title: 'Aviso de 30 segundos (Tramo final)',
      description: 'Doble pulsación para dar tu llamado a la acción o frase de cierre.',
      chimeType: 'thirtySeconds',
    },
    {
      key: 'timeExpiredAlert',
      title: 'Campana de tiempo cumplido (0:00)',
      description: 'Armónico resonante tipo cuenco tibetano que marca el límite exacto.',
      chimeType: 'timeExpired',
    },
    {
      key: 'overtimeBeeper',
      title: 'Recordatorio en tiempo extra',
      description: 'Toque discreto cada 30 segundos adicionales si te excedes de tu meta.',
      chimeType: 'overtimeWarning',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración de Alertas Sonoras</h3>
              <p className="text-xs text-neutral-400">
                Campanas acústicas sintetizadas en tiempo real con Web Audio API
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

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Master Audio Toggle & Volume Slider */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.enabled ? (
                  <Volume2 className="w-4 h-4 text-blue-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                )}
                <span className="text-sm font-semibold text-white">Sonido General</span>
              </div>
              <button
                onClick={() => handleToggle('enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-blue-600' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-neutral-400">Volumen:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })
                  }
                  className="flex-1 accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* List of individual alert rules */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
              Hitos de tiempo durante el ensayo
            </h4>

            {alertItems.map((item) => {
              const isChecked = !!settings[item.key];
              return (
                <div
                  key={item.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isChecked
                      ? 'bg-neutral-950/80 border-neutral-800'
                      : 'bg-neutral-950/40 border-neutral-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={item.key}
                          checked={isChecked}
                          onChange={() => handleToggle(item.key)}
                          className="rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <label
                          htmlFor={item.key}
                          className="text-sm font-semibold text-white cursor-pointer"
                        >
                          {item.title}
                        </label>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 pl-6 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTest(item.chimeType)}
                      disabled={!settings.enabled}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Probar sonido ahora"
                    >
                      <Play className="w-3 h-3 fill-current text-blue-400" />
                      <span>Probar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-neutral-800 bg-neutral-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
