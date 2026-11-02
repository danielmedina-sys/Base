import React from 'react';
import { Plus, Download, Upload, Landmark, Users, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DbStatusInfo } from '../utils/api';

interface HeaderProps {
  activeView: 'accounts' | 'contacts';
  setActiveView: (view: 'accounts' | 'contacts') => void;
  onOpenNewModal: () => void;
  onOpenImportExport: () => void;
  onExportExcel: () => void;
  onOpenSyncModal: () => void;
  onQuickSync: () => void;
  isSyncing: boolean;
  statusInfo: DbStatusInfo | null;
  dataSource: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenNewModal,
  onOpenImportExport,
  onExportExcel,
  onOpenSyncModal,
  onQuickSync,
  isSyncing,
  statusInfo,
  dataSource,
}) => {
  const isPostgres = statusInfo?.connected && statusInfo?.hasPostgresEnv;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark & Sync indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Landmark className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                BancaDatos
              </span>
              {/* Cloud Sync Status Pill */}
              <button
                onClick={onOpenSyncModal}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border ${
                  isPostgres
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Estado de base de datos y sincronización"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPostgres ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <Database className="w-3 h-3" />
                <span>{isPostgres ? 'Vercel Postgres' : 'Servidor API'}</span>
              </button>
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">
              Gestión compartida de Cuentas y Contactos
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('accounts')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeView === 'accounts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Cuentas y Pagos</span>
          </button>
          <button
            onClick={() => setActiveView('contacts')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeView === 'contacts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contactos Agrupados</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick sync button */}
          <button
            onClick={onQuickSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Sincronizar con la base de datos central"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span className="hidden lg:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          <button
            onClick={onOpenImportExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Importar o Exportar Excel / CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Importar / Exportar</span>
          </button>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Descargar archivo Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>
    </header>
  );
};
