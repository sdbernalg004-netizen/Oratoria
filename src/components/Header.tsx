import React from 'react';
import { Maximize2, Minimize2, Bell, History, Split, Monitor, HelpCircle, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  currentView: 'reader-floating' | 'split' | 'timer-only' | 'history';
  onViewChange: (view: 'reader-floating' | 'split' | 'timer-only' | 'history') => void;
  onOpenSoundModal: () => void;
  onOpenShortcuts: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenSoundModal,
  onOpenShortcuts,
  isFullscreen,
  onToggleFullscreen,
  historyCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-5 py-3 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold text-sm">
          OP
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            OratoriaPro
          </span>
          <span className="text-[11px] text-neutral-400 tracking-wide font-normal">
            Atril, Lector & Cronómetro Adaptable
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / View Switchers (Single line) */}
      <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onViewChange('reader-floating')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentView === 'reader-floating'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
          title="Lector de fuentes con cronómetro flotante adaptable"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Lector & Flotante</span>
        </button>

        <button
          onClick={() => onViewChange('split')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentView === 'split'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Atril Dividido</span>
        </button>

        <button
          onClick={() => onViewChange('timer-only')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentView === 'timer-only'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Solo Cronómetro</span>
        </button>

        <button
          onClick={() => onViewChange('history')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentView === 'history'
              ? 'text-white border-b-2 border-blue-500 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historial ({historyCount})</span>
        </button>

        <button
          onClick={onOpenSoundModal}
          className="flex items-center gap-1.5 transition-colors hover:text-neutral-200 whitespace-nowrap py-1 text-neutral-400"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alertas Sonoras</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Utility */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenShortcuts}
          title="Atajos de teclado"
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-neutral-800"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 rounded-lg transition-colors whitespace-nowrap"
          title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Modo Podio / Pantalla Completa (F)'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Salir</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Modo Podio</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
