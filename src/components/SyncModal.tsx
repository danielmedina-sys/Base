import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  Server,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { DbStatusInfo } from '../utils/api';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusInfo: DbStatusInfo | null;
  isLoadingStatus: boolean;
  onRefreshStatus: () => void;
  onPullFromCloud: () => void;
  onPushToCloud: () => void;
  onResetCloudData: () => void;
  totalContacts: number;
  lastSyncTime: Date | null;
  dataSource: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  statusInfo,
  isLoadingStatus,
  onRefreshStatus,
  onPullFromCloud,
  onPushToCloud,
  onResetCloudData,
  totalContacts,
  lastSyncTime,
  dataSource,
}) => {
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const isPostgres = statusInfo?.connected && statusInfo.hasPostgresEnv;

  const envSnippet = `# Variables inyectadas automáticamente al crear Vercel Postgres en vercel.com
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">
                Sincronización en la Nube
              </h2>
              <p className="text-xs text-slate-400">
                Vercel Postgres & API Multi-Usuario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              isPostgres
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            {isPostgres ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {isPostgres
                    ? 'Conectado a Vercel Postgres'
                    : 'Modo Servidor / Memoria Local'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                    isPostgres
                      ? 'bg-emerald-200/80 text-emerald-800'
                      : 'bg-amber-200/80 text-amber-900'
                  }`}
                >
                  {statusInfo?.provider || 'API Servidor'}
                </span>
              </div>
              <p className="mt-1 text-slate-600 leading-relaxed">
                {statusInfo?.message ||
                  (isPostgres
                    ? 'La base de datos PostgreSQL está activa. Los contactos y cuentas se comparten en tiempo real entre todos los usuarios.'
                    : 'La variable POSTGRES_URL no está detectada en este entorno. El servidor sincroniza los datos mediante memoria y respaldo local.')}
              </p>
              {lastSyncTime && (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  <span>
                    Última sincronización con servidor:{' '}
                    <strong>{lastSyncTime.toLocaleTimeString()}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cloud Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acciones de Sincronización
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={onPullFromCloud}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium transition-colors border border-slate-200"
              >
                <CloudDownload className="w-4 h-4 text-emerald-600" />
                <span>Descargar datos de la Nube</span>
              </button>

              <button
                onClick={onPushToCloud}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
              >
                <CloudUpload className="w-4 h-4 text-emerald-400" />
                <span>Subir datos locales a la Nube</span>
              </button>
            </div>
          </div>

          {/* Vercel Postgres Configuration Helper */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold text-slate-800">
                  ¿Cómo activar Vercel Postgres en tu despliegue?
                </span>
              </div>
              <button
                onClick={handleCopyEnv}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-white border border-slate-200"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar formato</span>
                  </>
                )}
              </button>
            </div>

            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Entra a tu proyecto en{' '}
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-medium hover:underline inline-flex items-center gap-0.5"
                >
                  vercel.com <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              </li>
              <li>Ve a la pestaña <strong>Storage</strong> y haz clic en <strong>Create Database</strong> → <strong>Postgres</strong>.</li>
              <li>Acepta y haz clic en <strong>Connect to Project</strong>. Vercel inyectará automáticamente <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">POSTGRES_URL</code>.</li>
              <li>¡Listo! La aplicación detecta el enlace automáticamente y crea la tabla de cuentas y contactos sin necesidad de configuraciones adicionales.</li>
            </ol>
          </div>

          {/* Reset button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onRefreshStatus}
              disabled={isLoadingStatus}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium py-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-emerald-600' : ''}`}
              />
              <span>Verificar conexión</span>
            </button>

            <button
              onClick={onResetCloudData}
              className="text-xs text-red-600 hover:text-red-700 hover:underline py-1.5 font-medium"
            >
              Restablecer base a datos de prueba
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{totalContacts} contactos sincronizados</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
