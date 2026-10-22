import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Bell,
  History,
  Split,
  Monitor,
  HelpCircle,
  BookOpen,
  FolderOpen,
  Cloud,
  LogOut,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentView: 'reader-floating' | 'split' | 'timer-only' | 'history';
  onViewChange: (view: 'reader-floating' | 'split' | 'timer-only' | 'history') => void;
  onOpenSoundModal: () => void;
  onOpenShortcuts: () => void;
  onOpenSavedSpeeches: () => void;
  speechesCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  historyCount: number;
  isJehovahsWitness?: boolean | null;
  onOpenJwModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenSoundModal,
  onOpenShortcuts,
  onOpenSavedSpeeches,
  speechesCount,
  isFullscreen,
  onToggleFullscreen,
  historyCount,
  isJehovahsWitness,
  onOpenJwModal,
}) => {
  const { user, loading, signIn, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-5 py-2.5 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-30">
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
            Atril, Lector & Cronómetro
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / View Switchers */}
      <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-neutral-400">
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
          onClick={onOpenSavedSpeeches}
          className="flex items-center gap-1.5 transition-colors hover:text-neutral-200 whitespace-nowrap py-1 text-neutral-400 hover:text-white"
          title="Ver bosquejos y documentos guardados"
        >
          <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Mis Bosquejos ({speechesCount})</span>
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
          <span>Alertas</span>
        </button>
      </nav>

      {/* Zone 3: Auth & Utility Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Saved Speeches mobile shortcut */}
        <button
          onClick={onOpenSavedSpeeches}
          className="md:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-neutral-800"
          title="Mis Bosquejos"
        >
          <FolderOpen className="w-4 h-4 text-blue-400" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Oratory Focus Badge / Switcher */}
        {onOpenJwModal && (
          <button
            onClick={onOpenJwModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors"
            title="Configurar fuente de consejos (Libro Benefíciese de jw.org u Oratoria General)"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>{isJehovahsWitness ? 'Benefíciese (JW)' : 'Oratoria General'}</span>
          </button>
        )}

        {/* Shortcuts Guide */}
        <button
          onClick={onOpenShortcuts}
          title="Atajos de teclado"
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-neutral-800"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 rounded-lg transition-colors whitespace-nowrap"
          title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Modo Podio / Pantalla Completa (F)'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Salir</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Podio</span>
            </>
          )}
        </button>

        {/* Auth Section: User Avatar or Sign In Button */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse border border-neutral-700" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              title={user.email || 'Mi Cuenta'}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-6 h-6 rounded-full object-cover border border-neutral-600"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
              <span className="text-xs font-medium text-neutral-200 max-w-[100px] truncate hidden sm:inline">
                {user.displayName || 'Mi Cuenta'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" title="Sincronizado en la nube" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-neutral-800/80">
                  <p className="text-xs font-semibold text-white truncate">{user.displayName || 'Orador'}</p>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Bosquejos sincronizados</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenSavedSpeeches();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 flex items-center gap-2.5 transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mis Bosquejos ({speechesCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onViewChange('history');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 flex items-center gap-2.5 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Historial de Ensayos</span>
                  </button>

                  {onOpenJwModal && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenJwModal();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 flex items-center justify-between transition-colors border-t border-neutral-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span>Enfoque de Oratoria</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isJehovahsWitness
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {isJehovahsWitness ? 'Benefíciese' : 'General'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="pt-1 mt-1 border-t border-neutral-800/80">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={signIn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            title="Inicia sesión con Google para guardar tus bosquejos y discursos"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>
    </header>
  );
};
