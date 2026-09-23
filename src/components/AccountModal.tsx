import React, { useState, useEffect } from 'react';
import { Contact, BankAccount, DocumentType, AccountType, ContactCategory } from '../types';
import { ALL_BANKS, detectBankByAccountNumber, findBankByNameOrCode } from '../data/banks';
import { isValidVeAccount } from '../utils/formatter';
import { X, Check, Landmark, User, CreditCard, AlertCircle } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Partial<Contact>, accountData: Partial<BankAccount>) => void;
  initialContact?: Contact | null;
  initialAccount?: BankAccount | null;
  isAddingAccountToExistingContact?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact,
  initialAccount,
  isAddingAccountToExistingContact = false,
}) => {
  // Contact state
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('V');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<ContactCategory>('Proveedor');
  const [contactNotes, setContactNotes] = useState('');

  // Account state
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Corriente');
  const [currency, setCurrency] = useState<'VES' | 'USD' | 'EUR' | 'USDT'>('VES');
  const [hasMobilePayment, setHasMobilePayment] = useState(false);
  const [mobilePhone, setMobilePhone] = useState('');
  const [accountNotes, setAccountNotes] = useState('');

  // Validation error state
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialContact) {
      setName(initialContact.name || '');
      setAlias(initialContact.alias || '');
      setDocumentType(initialContact.documentType || 'V');
      setDocumentNumber(initialContact.documentNumber || '');
      setEmail(initialContact.email || '');
      setPhone(initialContact.phone || '');
      setCategory(initialContact.category || 'Proveedor');
      setContactNotes(initialContact.notes || '');
    } else {
      setName('');
      setAlias('');
      setDocumentType('V');
      setDocumentNumber('');
      setEmail('');
      setPhone('');
      setCategory('Proveedor');
      setContactNotes('');
    }

    if (initialAccount) {
      setAccountNumber(initialAccount.accountNumber || '');
      setBankName(initialAccount.bankName || '');
      setBankCode(initialAccount.bankCode || '');
      setAccountType(initialAccount.accountType || 'Corriente');
      setCurrency(initialAccount.currency || 'VES');
      setHasMobilePayment(initialAccount.hasMobilePayment || false);
      setMobilePhone(initialAccount.mobilePaymentPhone || initialContact?.phone || '');
      setAccountNotes(initialAccount.notes || '');
    } else {
      setAccountNumber('');
      setBankName('');
      setBankCode('');
      setAccountType('Corriente');
      setCurrency('VES');
      setHasMobilePayment(false);
      setMobilePhone('');
      setAccountNotes('');
    }
    setErrorMsg('');
  }, [initialContact, initialAccount, isOpen]);

  if (!isOpen) return null;

  // Auto detect bank as user enters account digits
  const handleAccountNumberChange = (val: string) => {
    // remove spaces and non-digits if currency is VES
    const cleaned = currency === 'VES' ? String(val || '').replace(/[^\d]/g, '') : String(val || '');
    setAccountNumber(cleaned);

    if (cleaned.length >= 4) {
      const detected = detectBankByAccountNumber(cleaned);
      if (detected) {
        setBankName(detected.name);
        setBankCode(detected.code);
        if (detected.hasMobilePayment && !hasMobilePayment) {
          setHasMobilePayment(true);
          if (!mobilePhone && phone) setMobilePhone(phone);
        }
      }
    }
  };

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const bank = ALL_BANKS.find((b) => b.code === selectedCode);
    if (bank) {
      setBankName(bank.name);
      setBankCode(bank.code);
      // If account number is less than 4 digits, start with bank code
      if (currency === 'VES' && accountNumber.length < 4) {
        setAccountNumber(bank.code);
      }
    } else {
      setBankName('');
      setBankCode('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del titular o beneficiario es obligatorio.');
      return;
    }
    if (!documentNumber.trim()) {
      setErrorMsg('El número de documento (Cédula / RIF) es obligatorio.');
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMsg('El número de cuenta bancaria es obligatorio.');
      return;
    }
    if (currency === 'VES') {
      const veValidation = isValidVeAccount(accountNumber);
      if (!veValidation.isValid) {
        setErrorMsg(`Para cuentas en Bolívares (VES), se requieren exactamente 20 dígitos. ${veValidation.message}`);
        return;
      }
    }

    const contactPayload: Partial<Contact> = {
      name: name.trim().toUpperCase(),
      alias: alias.trim() || undefined,
      documentType,
      documentNumber: String(documentNumber || '').trim().replace(/\D/g, ''),
      email: email.trim().toLowerCase() || undefined,
      phone: phone.trim() || undefined,
      category,
      notes: contactNotes.trim(),
    };

    const accountPayload: Partial<BankAccount> = {
      accountNumber: accountNumber.trim(),
      bankName: bankName.trim() || 'Banco no especificado',
      bankCode: bankCode.trim() || (accountNumber.length >= 4 ? accountNumber.slice(0, 4) : '0000'),
      accountType,
      currency,
      hasMobilePayment,
      mobilePaymentPhone: hasMobilePayment ? (mobilePhone || phone) : undefined,
      notes: accountNotes.trim(),
    };

    onSave(contactPayload, accountPayload);
    onClose();
  };

  const veCheck = isValidVeAccount(accountNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Landmark className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {isAddingAccountToExistingContact
                  ? `Agregar Nueva Cuenta a ${initialContact?.name}`
                  : initialAccount
                  ? 'Editar Cuenta Bancaria / Contacto'
                  : 'Registrar Nueva Cuenta Bancaria & Contacto'}
              </h2>
              <p className="text-xs text-slate-500">
                Completa los datos para transferencias, pagos móviles y facturación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Contact Information */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Datos del Titular / Contacto</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo / Razón Social <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. ROSANA BEATRIZ OROPEZA RUBIO o EMPRESA C.A."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900 uppercase"
                />
              </div>

              {/* Alias / Familiar Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alias / Nombre Corto
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="ej. rosana, diseño, proveedor telas"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Útil para búsquedas rápidas informales
                </span>
              </div>

              {/* Document ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  C.I. / RIF <span className="text-rose-600">*</span>
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:bg-white focus:ring-2 focus:ring-slate-900 shrink-0 font-medium"
                  >
                    <option value="V">V - Venezolano</option>
                    <option value="J">J - RIF Jurídico</option>
                    <option value="E">E - Extranjero</option>
                    <option value="G">G - Gobierno</option>
                    <option value="P">P - Pasaporte</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="ej. 23490380"
                    className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. roropeza@allstarpublicidad.com"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono Principal
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!mobilePhone) setMobilePhone(e.target.value);
                  }}
                  placeholder="ej. 0414-2349038"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría de Contacto
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ContactCategory)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Proveedor">Proveedor</option>
                  <option value="Nómina / Empleado">Nómina / Empleado</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Socio / Directivo">Socio / Directivo</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Personal">Personal</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Contact Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Departamento
                </label>
                <input
                  type="text"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="ej. Publicidad, pagos quincenales"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bank Account Details */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Datos de la Cuenta Bancaria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Account Number */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Número de Cuenta Bancaria (20 dígitos) <span className="text-rose-600">*</span>
                  </label>
                  {currency === 'VES' && (
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        veCheck.isValid ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {String(accountNumber || '').replace(/\D/g, '').length}/20 dígitos
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  placeholder="ej. 01740149131494043803 o 01020372430000103334"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900 font-mono tracking-wider"
                />
                {bankName && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Banco detectado: <strong>{bankName}</strong> ({bankCode})
                    </span>
                  </div>
                )}
              </div>

              {/* Bank Selector (or override) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banco
                </label>
                <select
                  value={bankCode}
                  onChange={handleBankSelect}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Seleccionar entidad bancaria...</option>
                  {ALL_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Corriente">Corriente</option>
                  <option value="Ahorro">Ahorro</option>
                  <option value="Moneda Extranjera / Dólares">Moneda Extranjera / Dólares</option>
                  <option value="Custodia">Custodia</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Internacional">Internacional</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                >
                  <option value="VES">VES (Bolívares)</option>
                  <option value="USD">USD (Dólares)</option>
                  <option value="EUR">EUR (Euros)</option>
                  <option value="USDT">USDT (Cripto)</option>
                </select>
              </div>

              {/* Mobile Payment Toggle */}
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasMobilePayment}
                    onChange={(e) => {
                      setHasMobilePayment(e.target.checked);
                      if (e.target.checked && !mobilePhone) setMobilePhone(phone);
                    }}
                    className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Habilitar Pago Móvil
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Permite generar ficha de pago móvil con 1 clic
                    </span>
                  </div>
                </label>
              </div>

              {/* Mobile Phone (if enabled) */}
              {hasMobilePayment && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono para Pago Móvil
                  </label>
                  <input
                    type="text"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    placeholder="ej. 0414-2349038"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              )}

              {/* Account Specific Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de la Cuenta (opcional)
                </label>
                <input
                  type="text"
                  value={accountNotes}
                  onChange={(e) => setAccountNotes(e.target.value)}
                  placeholder="ej. Cuenta principal, sólo nómina, etc."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
