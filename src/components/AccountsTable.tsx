import React, { useState } from 'react';
import { FlattenedAccountRow } from '../utils/excel';
import { formatAccountNumber, formatPhone } from '../utils/formatter';
import {
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Edit2,
  Trash2,
  FileText,
  Mail,
  PhoneCall,
  MoreHorizontal
} from 'lucide-react';

interface AccountsTableProps {
  rows: FlattenedAccountRow[];
  onSelectAccount: (contactId: string, accountId: string) => void;
  onEditAccount: (contactId: string, accountId: string) => void;
  onDeleteAccount: (contactId: string, accountId: string) => void;
  onCopyTransferSummary: (row: FlattenedAccountRow) => void;
  onCopyText: (text: string, label: string) => void;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  rows,
  onSelectAccount,
  onEditAccount,
  onDeleteAccount,
  onCopyTransferSummary,
  onCopyText,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(rows.length / pageSize);
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedRows = pageSize === -1
    ? rows
    : rows.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const handleCopyField = (text: string, id: string, label: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No se encontraron cuentas</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No hay registros que coincidan con los términos de búsqueda o filtros seleccionados. Intenta ajustar los criterios de búsqueda o importar tu archivo Excel completo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Titular / Beneficiario</th>
              <th className="py-3 px-4">Banco</th>
              <th className="py-3 px-4">Número de Cuenta</th>
              <th className="py-3 px-4">C.I. / RIF</th>
              <th className="py-3 px-4">Contacto / Pago Móvil</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4 text-right">Acciones Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row) => {
              const rawAcc = String(row.accountNumber || '');
              const formattedAcc = formatAccountNumber(rawAcc);
              const isVeDigits = rawAcc.replace(/\D/g, '').length === 20;

              return (
                <tr
                  key={`${row.contactId}-${row.accountId}`}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Beneficiary Name & Alias */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          onClick={() => onSelectAccount(row.contactId, row.accountId)}
                          className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors truncate"
                          title={row.name}
                        >
                          {row.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        {row.alias && (
                          <>
                            <span className="text-slate-700 font-medium">
                              {row.alias}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{row.category}</span>
                        {row.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[140px]" title={row.notes}>
                              {row.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Bank */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">
                          {row.bankName}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Cód: {row.bankCode}
                      </span>
                    </div>
                  </td>

                  {/* Account Number with Quick Copy */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono tabular-nums text-xs ${
                          isVeDigits ? 'text-slate-900 font-medium' : 'text-slate-600'
                        }`}
                        title={row.accountNumber}
                      >
                        {formattedAcc}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyField(row.accountNumber, `acc-${row.accountId}`, 'Número de cuenta')
                        }
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Copiar número de cuenta"
                      >
                        {copiedId === `acc-${row.accountId}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Document ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-slate-800 font-medium">
                        {row.documentFull}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyField(row.documentNumber, `doc-${row.accountId}`, 'Cédula / RIF')
                        }
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Copiar sólo dígitos del documento"
                      >
                        {copiedId === `doc-${row.accountId}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Phone & Mobile Payment */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {row.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono tabular-nums text-slate-700">
                            {formatPhone(row.phone)}
                          </span>
                          <button
                            onClick={() =>
                              handleCopyField(row.phone, `tel-${row.accountId}`, 'Teléfono')
                            }
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Copiar teléfono"
                          >
                            {copiedId === `tel-${row.accountId}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin teléfono</span>
                      )}

                      <div className="flex items-center gap-1 text-[11px] mt-0.5">
                        {row.hasMobilePayment ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            Pago Móvil activo
                          </span>
                        ) : (
                          <span className="text-slate-400">Transferencia normal</span>
                        )}
                        {row.email && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500 truncate max-w-[120px]" title={row.email}>
                              {row.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Account Type & Currency */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-medium">{row.accountType}</span>
                      <span className="text-[11px] font-mono text-slate-400">{row.currency}</span>
                    </div>
                  </td>

                  {/* Quick Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Copy Complete Transfer Voucher */}
                      <button
                        onClick={() => onCopyTransferSummary(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        title="Copiar datos completos de pago listos para WhatsApp / Email"
                      >
                        <Copy className="w-3 h-3 text-slate-600" />
                        <span>Ficha</span>
                      </button>

                      {/* Detail Drawer */}
                      <button
                        onClick={() => onSelectAccount(row.contactId, row.accountId)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Ver detalles completos"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditAccount(row.contactId, row.accountId)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Editar cuenta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteAccount(row.contactId, row.accountId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Eliminar esta cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {rows.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-slate-900"
            >
              <option value={15}>15 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
              <option value={-1}>Todos ({rows.length})</option>
            </select>
            <span>
              Mostrando{' '}
              <strong className="font-mono tabular-nums text-slate-800">
                {pageSize === -1
                  ? `1–${rows.length}`
                  : `${(effectivePage - 1) * pageSize + 1}–${Math.min(
                      effectivePage * pageSize,
                      rows.length
                    )}`}
              </strong>{' '}
              de <span className="font-mono tabular-nums">{rows.length}</span> cuentas
            </span>
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={effectivePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Anterior
              </button>

              <span className="px-2 text-slate-600 font-medium">
                Pág. <strong className="text-slate-900 font-mono">{effectivePage}</strong> de{' '}
                <span className="font-mono">{totalPages}</span>
              </span>

              <button
                disabled={effectivePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
