import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsGuideModal: React.FC<ShortcutsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Barra Espaciadora', action: 'Iniciar / Pausar cronómetro' },
    { key: 'R', action: 'Reiniciar cronómetro al tiempo original' },
    { key: 'F', action: 'Alternar Modo Podio (Pantalla Completa)' },
    { key: 'M', action: 'Silenciar o reactivar alertas sonoras' },
    { key: 'Esc', action: 'Cerrar cualquier ventana emergente o pantalla completa' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Atajos de Teclado Rápidos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          <p className="text-xs text-neutral-400 mb-3">
            Controla tu ensayo sin apartar la mirada de tu discurso:
          </p>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-800/80 text-xs"
            >
              <span className="text-neutral-300">{s.action}</span>
              <kbd className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded-md font-mono text-[11px] text-white shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
