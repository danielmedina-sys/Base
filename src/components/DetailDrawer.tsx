import React, { useState } from 'react';
import { Contact, BankAccount } from '../types';
import {
  formatAccountNumber,
  formatPhone,
  generateTransferSummary,
  generateMobilePaymentSummary
} from '../utils/formatter';
import {
  X,
  User,
  Building,
  CreditCard,
  Copy,
  Check,
  Smartphone,
  Mail,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Share2,
  ExternalLink
} from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  selectedAccountId?: string | null;
  onEditContact: (contact: Contact) => void;
  onAddAccount: (contactId: string) => void;
  onDeleteAccount: (contactId: string, accountId: string) => void;
  onCopyText: (text: string, label: string) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  contact,
  selectedAccountId,
  onEditContact,
  onAddAccount,
  onDeleteAccount,
  onCopyText,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const handleCopy = (text: string, key: string, label: string) => {
    onCopyText(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              {contact.documentType === 'J' ? (
                <Building className="w-4 h-4 text-emerald-400" />
              ) : (
                <User className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ficha de Beneficiario
              </span>
              <h2 className="text-base font-bold text-slate-900 leading-tight truncate max-w-xs" title={contact.name}>
                {contact.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Beneficiary Data Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Identificación & Contacto
              </span>
              <button
                onClick={() => onEditContact(contact)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="w-3 h-3" />
                <span>Editar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Documento</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className="font-mono tabular-nums text-slate-900 text-sm">
                    {contact.documentType}-{contact.documentNumber}
                  </strong>
                  <button
                    onClick={() =>
                      handleCopy(contact.documentNumber, 'doc', 'Cédula / RIF')
                    }
                    className="text-slate-400 hover:text-slate-700"
                    title="Copiar número de documento"
                  >
                    {copiedKey === 'doc' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Alias / Nombre Corto</span>
                <span className="font-medium text-slate-800 block mt-0.5">
                  {contact.alias || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Categoría</span>
                <span className="font-medium text-slate-800 block mt-0.5">
                  {contact.category}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Teléfono</span>
                {contact.phone ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono tabular-nums text-slate-800">
                      {formatPhone(contact.phone)}
                    </span>
                    <button
                      onClick={() => handleCopy(contact.phone!, 'phone', 'Teléfono')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic mt-0.5 block">No registrado</span>
                )}
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 block text-[11px]">Correo Electrónico</span>
                {contact.email ? (
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-slate-900 font-medium truncate">{contact.email}</span>
                    <button
                      onClick={() => handleCopy(contact.email!, 'email', 'Correo')}
                      className="text-slate-400 hover:text-slate-700 shrink-0"
                    >
                      {copiedKey === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic mt-0.5 block">No registrado</span>
                )}
              </div>

              {contact.notes && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Observaciones</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{contact.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Associated Bank Accounts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Cuentas Bancarias Registradas ({contact.accounts.length})</span>
              </h3>
              <button
                onClick={() => onAddAccount(contact.id)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Cuenta</span>
              </button>
            </div>

            {contact.accounts.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-lg">
                No hay cuentas bancarias asociadas a este contacto.
              </p>
            ) : (
              contact.accounts.map((acc) => {
                const isCurrentHighlighted = acc.id === selectedAccountId;
                const transferSummary = generateTransferSummary(contact, acc);
                const mobileSummary = generateMobilePaymentSummary(contact, acc);

                return (
                  <div
                    key={acc.id}
                    className={`border rounded-xl p-4 transition-all ${
                      isCurrentHighlighted
                        ? 'border-slate-900 bg-slate-50/60 shadow-xs ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Bank & Type */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {acc.bankName}
                          <span className="text-[11px] font-mono text-slate-500 font-normal">
                            ({acc.bankCode})
                          </span>
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>{acc.accountType}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{acc.currency}</span>
                          {acc.hasMobilePayment && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                                <Smartphone className="w-3 h-3 text-emerald-600" />
                                Pago Móvil
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteAccount(contact.id, acc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Eliminar esta cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Account Number Box */}
                    <div className="bg-slate-100 rounded-lg p-2.5 flex items-center justify-between font-mono tabular-nums text-xs font-semibold text-slate-900 mb-3">
                      <span>{formatAccountNumber(acc.accountNumber)}</span>
                      <button
                        onClick={() =>
                          handleCopy(acc.accountNumber, `acc-${acc.id}`, 'Número de cuenta')
                        }
                        className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                        title="Copiar número"
                      >
                        {copiedKey === `acc-${acc.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Quick Copy Action Buttons for Transfer & Pago Movil */}
                    <div className="space-y-1.5">
                      <button
                        onClick={() =>
                          handleCopy(transferSummary, `full-${acc.id}`, 'Ficha completa de pago')
                        }
                        className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        {copiedKey === `full-${acc.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>¡Ficha Completa Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Ficha Completa para Transferencia</span>
                          </>
                        )}
                      </button>

                      {acc.hasMobilePayment && (
                        <button
                          onClick={() =>
                            handleCopy(mobileSummary, `pm-${acc.id}`, 'Datos de Pago Móvil')
                          }
                          className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {copiedKey === `pm-${acc.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>¡Datos de Pago Móvil Copiados!</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copiar Datos de Pago Móvil</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {acc.notes && (
                      <p className="text-[11px] text-slate-500 mt-2 italic">
                        Nota: {acc.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>Actualizado recientemente</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
