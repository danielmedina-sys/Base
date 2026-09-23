import React, { useState } from 'react';
import { Contact, BankAccount } from '../types';
import { formatAccountNumber, formatPhone } from '../utils/formatter';
import {
  User,
  Building,
  Smartphone,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CreditCard,
  Mail,
  Phone
} from 'lucide-react';

interface ContactsGridProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onAddAccountToContact: (contactId: string) => void;
  onDeleteAccount: (contactId: string, accountId: string) => void;
  onCopyTransferSummary: (contact: Contact, account: BankAccount) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ContactsGrid: React.FC<ContactsGridProps> = ({
  contacts,
  onSelectContact,
  onEditContact,
  onDeleteContact,
  onAddAccountToContact,
  onDeleteAccount,
  onCopyTransferSummary,
  onCopyText,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(contacts.length / pageSize);
  const effectivePage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedContacts = pageSize === -1
    ? contacts
    : contacts.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const handleCopy = (text: string, id: string, label: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No hay contactos para mostrar</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Ajusta los filtros de búsqueda o agrega un nuevo contacto para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedContacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            {/* Card Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 mt-0.5">
                    {contact.documentType === 'J' ? (
                      <Building className="w-4 h-4 text-slate-600" />
                    ) : (
                      <User className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h3
                      onClick={() => onSelectContact(contact.id)}
                      className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {contact.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      {contact.alias && (
                        <>
                          <span className="text-slate-800 font-medium">{contact.alias}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span className="font-mono tabular-nums">
                        {contact.documentType}-{contact.documentNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{contact.category}</span>
                    </div>
                  </div>
                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onEditContact(contact)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Editar datos del contacto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Contact Info */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                {contact.email && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(contact.email!, `email-${contact.id}`, 'Correo')}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                      title="Copiar correo"
                    >
                      {copiedId === `email-${contact.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums">{formatPhone(contact.phone)}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(contact.phone!, `phone-${contact.id}`, 'Teléfono')}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                      title="Copiar teléfono"
                    >
                      {copiedId === `phone-${contact.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Associated Bank Accounts List */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Cuentas ({contact.accounts.length})</span>
                  <button
                    onClick={() => onAddAccountToContact(contact.id)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 normal-case font-medium text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar cuenta</span>
                  </button>
                </div>

                {contact.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs relative group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">
                          {acc.bankName}
                        </span>
                        {acc.hasMobilePayment && (
                          <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                            <Smartphone className="w-2.5 h-2.5 text-emerald-600" />
                            Pago Móvil
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onCopyTransferSummary(contact, acc)}
                          className="px-2 py-0.5 text-[11px] font-medium bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                          title="Copiar ficha de pago completa"
                        >
                          Copiar Ficha
                        </button>
                        <button
                          onClick={() => onDeleteAccount(contact.id, acc.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                          title="Eliminar esta cuenta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 font-mono tabular-nums text-[11px] bg-white px-2 py-1 rounded border border-slate-200">
                      <span className="truncate">{formatAccountNumber(acc.accountNumber)}</span>
                      <button
                        onClick={() => handleCopy(acc.accountNumber, `acc-${acc.id}`, 'Cuenta')}
                        className="text-slate-400 hover:text-slate-800 p-0.5"
                        title="Copiar número"
                      >
                        {copiedId === `acc-${acc.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer: Notes & Detailed View Button */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-[180px]">
                {contact.notes || 'Sin observaciones'}
              </span>
              <button
                onClick={() => onSelectContact(contact.id)}
                className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Ver ficha</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      {contacts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
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
              <option value={9}>9 por página</option>
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
              <option value={48}>48 por página</option>
              <option value={-1}>Todos ({contacts.length})</option>
            </select>
            <span>
              Mostrando{' '}
              <strong className="font-mono tabular-nums text-slate-800">
                {pageSize === -1
                  ? `1–${contacts.length}`
                  : `${(effectivePage - 1) * pageSize + 1}–${Math.min(
                      effectivePage * pageSize,
                      contacts.length
                    )}`}
              </strong>{' '}
              de <span className="font-mono tabular-nums">{contacts.length}</span> contactos
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
