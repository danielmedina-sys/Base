import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Contact, BankAccount, FilterState } from './types';
import { loadContacts, saveContacts, resetToDefaultData } from './utils/storage';
import { flattenContactsToRows, FlattenedAccountRow, exportToExcel } from './utils/excel';
import { generateTransferSummary } from './utils/formatter';

import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { AccountsTable } from './components/AccountsTable';
import { ContactsGrid } from './components/ContactsGrid';
import { AccountModal } from './components/AccountModal';
import { ImportExportModal } from './components/ImportExportModal';
import { DetailDrawer } from './components/DetailDrawer';
import { Toast } from './components/Toast';
import { FileSpreadsheet, UploadCloud, Database, Sparkles, X } from 'lucide-react';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts());
  const [activeView, setActiveView] = useState<'accounts' | 'contacts'>('accounts');

  // Drag and drop state
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [dismissBanner, setDismissBanner] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    bank: '',
    category: '',
    accountType: '',
    documentType: '',
    onlyMobilePayment: false,
    currency: '',
    sortBy: 'name_asc',
  });

  // Modals & Drawers
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Selected state for editing / viewing
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAddingAccountToExistingContact, setIsAddingAccountToExistingContact] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Save to localStorage when contacts state changes
  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  // Total Accounts count
  const totalAccountsCount = useMemo(() => {
    return contacts.reduce((total, c) => total + (c.accounts?.length || 0), 0);
  }, [contacts]);

  // Flatten accounts to row representation for ledger view
  const allAccountRows = useMemo(() => {
    return flattenContactsToRows(contacts);
  }, [contacts]);

  // Filter & Search Logic for Accounts Table
  const filteredAccountRows = useMemo(() => {
    let result = [...allAccountRows];
    const q = (filters.searchQuery || '').trim().toLowerCase();
    const cleanDigitsQuery = q.replace(/\D/g, '');

    if (q) {
      result = result.filter((row) => {
        const matchName = String(row.name || '').toLowerCase().includes(q);
        const matchAlias = String(row.alias || '').toLowerCase().includes(q);
        const matchBank = String(row.bankName || '').toLowerCase().includes(q);
        const matchEmail = String(row.email || '').toLowerCase().includes(q);
        const matchDoc =
          String(row.documentNumber || '').includes(q) ||
          String(row.documentFull || '').toLowerCase().includes(q);
        const rawAccount = String(row.accountNumber || '');
        const matchAccount =
          rawAccount.toLowerCase().includes(q) ||
          (cleanDigitsQuery.length >= 3 && rawAccount.replace(/\D/g, '').includes(cleanDigitsQuery));
        const matchPhone = String(row.phone || '').includes(q);
        const matchNotes = String(row.notes || '').toLowerCase().includes(q);

        return (
          matchName ||
          matchAlias ||
          matchBank ||
          matchEmail ||
          matchDoc ||
          matchAccount ||
          matchPhone ||
          matchNotes
        );
      });
    }

    if (filters.bank) {
      const bq = filters.bank.toLowerCase();
      result = result.filter((r) => String(r.bankName || '').toLowerCase().includes(bq));
    }

    if (filters.category) {
      result = result.filter((r) => r.category === filters.category);
    }

    if (filters.accountType) {
      result = result.filter((r) => r.accountType === filters.accountType);
    }

    if (filters.documentType) {
      result = result.filter((r) => r.documentType === filters.documentType);
    }

    if (filters.onlyMobilePayment) {
      result = result.filter((r) => r.hasMobilePayment);
    }

    if (filters.currency) {
      result = result.filter((r) => r.currency === filters.currency);
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'name_asc') {
        return String(a.name || '').localeCompare(String(b.name || ''));
      }
      if (filters.sortBy === 'name_desc') {
        return String(b.name || '').localeCompare(String(a.name || ''));
      }
      if (filters.sortBy === 'bank_asc') {
        return String(a.bankName || '').localeCompare(String(b.bankName || ''));
      }
      if (filters.sortBy === 'updated_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });

    return result;
  }, [allAccountRows, filters]);

  // Filter Logic for Contacts Grid View
  const filteredContacts = useMemo(() => {
    let result = [...contacts];
    const q = (filters.searchQuery || '').trim().toLowerCase();
    const cleanDigits = q.replace(/\D/g, '');

    if (q) {
      result = result.filter((c) => {
        const matchName = String(c.name || '').toLowerCase().includes(q);
        const matchAlias = String(c.alias || '').toLowerCase().includes(q);
        const matchEmail = String(c.email || '').toLowerCase().includes(q);
        const matchPhone = String(c.phone || '').includes(q);
        const matchDoc =
          String(c.documentNumber || '').includes(q) ||
          `${c.documentType || 'V'}-${c.documentNumber || ''}`.toLowerCase().includes(q);
        const matchNotes = String(c.notes || '').toLowerCase().includes(q);

        const matchAccounts = (c.accounts || []).some((acc) => {
          const rawAcc = String(acc?.accountNumber || '');
          const matchAccNum =
            rawAcc.toLowerCase().includes(q) ||
            (cleanDigits.length >= 3 && rawAcc.replace(/\D/g, '').includes(cleanDigits));
          const matchBank = String(acc?.bankName || '').toLowerCase().includes(q);
          const matchAccPhone = String(acc?.mobilePaymentPhone || '').includes(q);
          return matchAccNum || matchBank || matchAccPhone;
        });

        return (
          matchName ||
          matchAlias ||
          matchEmail ||
          matchPhone ||
          matchDoc ||
          matchNotes ||
          matchAccounts
        );
      });
    }

    if (filters.bank) {
      const bq = filters.bank.toLowerCase();
      result = result.filter((c) =>
        c.accounts.some((acc) => acc.bankName.toLowerCase().includes(bq))
      );
    }

    if (filters.category) {
      result = result.filter((c) => c.category === filters.category);
    }

    if (filters.documentType) {
      result = result.filter((c) => c.documentType === filters.documentType);
    }

    if (filters.onlyMobilePayment) {
      result = result.filter((c) =>
        c.accounts.some((acc) => acc.hasMobilePayment)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (filters.sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return result;
  }, [contacts, filters]);

  // Copy helper
  const handleCopyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`¡${label} copiado al portapapeles!`);
  }, [showToast]);

  // Copy full payment voucher
  const handleCopyTransferSummary = useCallback((row: FlattenedAccountRow) => {
    const contact = contacts.find((c) => c.id === row.contactId);
    const account = contact?.accounts.find((a) => a.id === row.accountId);
    if (contact && account) {
      const summary = generateTransferSummary(contact, account);
      navigator.clipboard.writeText(summary);
      showToast('¡Ficha completa de pago copiada para WhatsApp o correo!');
    }
  }, [contacts, showToast]);

  const handleCopyTransferSummaryFromContact = useCallback((contact: Contact, account: BankAccount) => {
    const summary = generateTransferSummary(contact, account);
    navigator.clipboard.writeText(summary);
    showToast('¡Ficha completa de pago copiada para WhatsApp o correo!');
  }, [showToast]);

  // Modal Open Handlers
  const handleOpenNewModal = () => {
    setSelectedContact(null);
    setSelectedAccountId(null);
    setIsAddingAccountToExistingContact(false);
    setIsAccountModalOpen(true);
  };

  const handleSelectAccount = (contactId: string, accountId: string) => {
    const foundContact = contacts.find((c) => c.id === contactId);
    if (foundContact) {
      setSelectedContact(foundContact);
      setSelectedAccountId(accountId);
      setIsDetailDrawerOpen(true);
    }
  };

  const handleSelectContact = (contactId: string) => {
    const foundContact = contacts.find((c) => c.id === contactId);
    if (foundContact) {
      setSelectedContact(foundContact);
      setSelectedAccountId(foundContact.accounts[0]?.id || null);
      setIsDetailDrawerOpen(true);
    }
  };

  const handleEditAccount = (contactId: string, accountId: string) => {
    const foundContact = contacts.find((c) => c.id === contactId);
    if (foundContact) {
      const foundAccount = foundContact.accounts.find((a) => a.id === accountId);
      setSelectedContact(foundContact);
      setSelectedAccountId(accountId);
      setIsAddingAccountToExistingContact(false);
      setIsAccountModalOpen(true);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setSelectedAccountId(contact.accounts[0]?.id || null);
    setIsAddingAccountToExistingContact(false);
    setIsAccountModalOpen(true);
  };

  const handleAddAccountToContact = (contactId: string) => {
    const foundContact = contacts.find((c) => c.id === contactId);
    if (foundContact) {
      setSelectedContact(foundContact);
      setSelectedAccountId(null);
      setIsAddingAccountToExistingContact(true);
      setIsAccountModalOpen(true);
    }
  };

  const handleDeleteAccount = (contactId: string, accountId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) return;

    setContacts((prev) =>
      prev
        .map((c) => {
          if (c.id === contactId) {
            const updatedAccounts = c.accounts.filter((a) => a.id !== accountId);
            return {
              ...c,
              accounts: updatedAccounts,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
        .filter((c) => c.accounts.length > 0) // optionally remove contact if empty
    );

    showToast('Cuenta bancaria eliminada');
    if (isDetailDrawerOpen && selectedContact?.id === contactId) {
      setIsDetailDrawerOpen(false);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    if (!confirm('¿Deseas eliminar este contacto y todas sus cuentas asociadas?')) return;

    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    showToast('Contacto y cuentas eliminados');
    if (isDetailDrawerOpen && selectedContact?.id === contactId) {
      setIsDetailDrawerOpen(false);
    }
  };

  // Save or Update contact & account
  const handleSaveContactAndAccount = (
    contactData: Partial<Contact>,
    accountData: Partial<BankAccount>
  ) => {
    const now = new Date().toISOString();

    if (isAddingAccountToExistingContact && selectedContact) {
      // Adding account to existing contact
      const newAcc: BankAccount = {
        id: `acc-${Date.now()}`,
        contactId: selectedContact.id,
        accountNumber: accountData.accountNumber || '',
        bankCode: accountData.bankCode || '',
        bankName: accountData.bankName || '',
        accountType: accountData.accountType || 'Corriente',
        currency: accountData.currency || 'VES',
        isDefault: selectedContact.accounts.length === 0,
        hasMobilePayment: Boolean(accountData.hasMobilePayment),
        mobilePaymentPhone: accountData.mobilePaymentPhone,
        notes: accountData.notes,
        createdAt: now,
        updatedAt: now,
      };

      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id
            ? {
                ...c,
                accounts: [...c.accounts, newAcc],
                updatedAt: now,
              }
            : c
        )
      );
      showToast('Nueva cuenta bancaria agregada al contacto');
    } else if (selectedContact && selectedAccountId) {
      // Editing existing account & contact
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === selectedContact.id) {
            return {
              ...c,
              ...contactData,
              updatedAt: now,
              accounts: c.accounts.map((acc) =>
                acc.id === selectedAccountId
                  ? {
                      ...acc,
                      ...accountData,
                      updatedAt: now,
                    }
                  : acc
              ),
            };
          }
          return c;
        })
      );
      showToast('Datos actualizados correctamente');
    } else {
      // Creating a new Contact + Account
      // Check if a contact with this document already exists to avoid duplicates
      const existingDoc = contacts.find(
        (c) =>
          c.documentNumber === contactData.documentNumber &&
          c.documentType === contactData.documentType
      );

      if (existingDoc) {
        // Append account to that existing contact!
        const newAcc: BankAccount = {
          id: `acc-${Date.now()}`,
          contactId: existingDoc.id,
          accountNumber: accountData.accountNumber || '',
          bankCode: accountData.bankCode || '',
          bankName: accountData.bankName || '',
          accountType: accountData.accountType || 'Corriente',
          currency: accountData.currency || 'VES',
          isDefault: existingDoc.accounts.length === 0,
          hasMobilePayment: Boolean(accountData.hasMobilePayment),
          mobilePaymentPhone: accountData.mobilePaymentPhone,
          notes: accountData.notes,
          createdAt: now,
          updatedAt: now,
        };

        setContacts((prev) =>
          prev.map((c) =>
            c.id === existingDoc.id
              ? {
                  ...c,
                  accounts: [...c.accounts, newAcc],
                  updatedAt: now,
                }
              : c
          )
        );
        showToast(`Cuenta agregada al contacto existente: ${existingDoc.name}`);
      } else {
        // Create brand new contact
        const contactId = `contact-${Date.now()}`;
        const newAcc: BankAccount = {
          id: `acc-${Date.now()}`,
          contactId,
          accountNumber: accountData.accountNumber || '',
          bankCode: accountData.bankCode || '',
          bankName: accountData.bankName || '',
          accountType: accountData.accountType || 'Corriente',
          currency: accountData.currency || 'VES',
          isDefault: true,
          hasMobilePayment: Boolean(accountData.hasMobilePayment),
          mobilePaymentPhone: accountData.mobilePaymentPhone,
          notes: accountData.notes,
          createdAt: now,
          updatedAt: now,
        };

        const newContact: Contact = {
          id: contactId,
          name: contactData.name || 'TITULAR',
          alias: contactData.alias,
          documentType: contactData.documentType || 'V',
          documentNumber: contactData.documentNumber || '',
          email: contactData.email,
          phone: contactData.phone,
          category: contactData.category || 'Proveedor',
          company: contactData.company,
          notes: contactData.notes,
          status: 'Activo',
          accounts: [newAcc],
          createdAt: now,
          updatedAt: now,
        };

        setContacts((prev) => [newContact, ...prev]);
        showToast('Nuevo registro bancario creado con éxito');
      }
    }
  };

  // Import handler
  const handleImportSuccess = (importedContacts: Contact[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setContacts(importedContacts);
      showToast(`Base de datos reemplazada con ${importedContacts.length} contactos.`);
    } else {
      // Merge by document number or append
      const mergedMap = new Map<string, Contact>();
      for (const c of contacts) {
        mergedMap.set(`${c.documentType}-${c.documentNumber}`, { ...c });
      }

      for (const imported of importedContacts) {
        const key = `${imported.documentType}-${imported.documentNumber}`;
        if (mergedMap.has(key)) {
          const current = mergedMap.get(key)!;
          // Merge accounts avoiding exact account number duplicates
          const existingAccNums = new Set(current.accounts.map((a) => a.accountNumber));
          for (const newAcc of imported.accounts) {
            if (!existingAccNums.has(newAcc.accountNumber)) {
              current.accounts.push({ ...newAcc, contactId: current.id });
            }
          }
          if (!current.email && imported.email) current.email = imported.email;
          if (!current.phone && imported.phone) current.phone = imported.phone;
          mergedMap.set(key, current);
        } else {
          mergedMap.set(key, imported);
        }
      }

      const mergedList = Array.from(mergedMap.values());
      setContacts(mergedList);
      showToast(`Importación completada. Total: ${mergedList.length} contactos.`);
    }
  };

  // Reset to default
  const handleResetData = () => {
    const initial = resetToDefaultData();
    setContacts(initial);
    showToast('Base de datos restaurada a los datos de ejemplo iniciales.');
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingFile(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          setDroppedFile(file);
          setIsImportExportOpen(true);
        }
      }}
      className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none animate-in fade-in duration-150">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border-2 border-dashed border-emerald-400 flex items-center justify-center mb-4">
            <UploadCloud className="w-10 h-10 text-emerald-400 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold">Suelta tu archivo de Excel aquí</h3>
          <p className="text-sm text-slate-300 mt-1 max-w-md">
            Compatible con archivos .xlsx, .xls y .csv. Se reconocerán automáticamente todas las cuentas y contactos sin límite de cantidad.
          </p>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewModal={handleOpenNewModal}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onExportExcel={() => exportToExcel(contacts)}
      />

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Quick Capacity & Excel Import Helper Banner */}
        {!dismissBanner && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Capacidad ilimitada para tus cuentas y contactos
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    10.000+ registros
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                  Puedes almacenar miles de cuentas bancarias sin restricciones. Si tu archivo de Excel tiene más filas de las que ves aquí, puedes cargarlo directamente o arrastrarlo a esta ventana para sincronizarlas al instante.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsImportExportOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar mi Excel completo</span>
              </button>
              <button
                onClick={() => setDismissBanner(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Bar */}
        <StatsBar
          contacts={contacts}
          totalAccountsCount={totalAccountsCount}
        />

        {/* Universal Search and Advanced Filters */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          totalMatches={
            activeView === 'accounts'
              ? filteredAccountRows.length
              : filteredContacts.length
          }
          totalRecords={
            activeView === 'accounts'
              ? allAccountRows.length
              : contacts.length
          }
        />

        {/* Active View: Accounts Table OR Contacts Grid */}
        {activeView === 'accounts' ? (
          <AccountsTable
            rows={filteredAccountRows}
            onSelectAccount={handleSelectAccount}
            onEditAccount={handleEditAccount}
            onDeleteAccount={handleDeleteAccount}
            onCopyTransferSummary={handleCopyTransferSummary}
            onCopyText={handleCopyText}
          />
        ) : (
          <ContactsGrid
            contacts={filteredContacts}
            onSelectContact={handleSelectContact}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            onAddAccountToContact={handleAddAccountToContact}
            onDeleteAccount={handleDeleteAccount}
            onCopyTransferSummary={handleCopyTransferSummaryFromContact}
            onCopyText={handleCopyText}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            BancaDatos · Sistema de Gestión de Cuentas Bancarias y Contactos
          </p>
          <div className="flex items-center gap-4">
            <span>Almacenamiento persistente local</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsImportExportOpen(true)}
              className="text-slate-700 hover:text-slate-900 font-medium"
            >
              Cargar / Exportar Excel
            </button>
          </div>
        </div>
      </footer>

      {/* Account & Contact Create/Edit Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveContactAndAccount}
        initialContact={selectedContact}
        initialAccount={
          selectedContact && selectedAccountId
            ? selectedContact.accounts.find((a) => a.id === selectedAccountId) || null
            : null
        }
        isAddingAccountToExistingContact={isAddingAccountToExistingContact}
      />

      {/* Import & Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => {
          setIsImportExportOpen(false);
          setDroppedFile(null);
        }}
        contacts={contacts}
        onImportSuccess={handleImportSuccess}
        onResetData={handleResetData}
        initialFile={droppedFile}
      />

      {/* Contact & Account Detail Drawer */}
      <DetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        contact={selectedContact}
        selectedAccountId={selectedAccountId}
        onEditContact={handleEditContact}
        onAddAccount={handleAddAccountToContact}
        onDeleteAccount={handleDeleteAccount}
        onCopyText={handleCopyText}
      />

      {/* Instant Action Feedback Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}
