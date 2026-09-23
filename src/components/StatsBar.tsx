import React from 'react';
import { Contact } from '../types';
import { Landmark, Users, Smartphone, Layers } from 'lucide-react';

interface StatsBarProps {
  contacts: Contact[];
  totalAccountsCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ contacts, totalAccountsCount }) => {
  const uniqueBanks = new Set<string>();
  let mobilePaymentCount = 0;

  contacts.forEach((c) => {
    c.accounts.forEach((a) => {
      if (a.bankName) uniqueBanks.add(a.bankName);
      if (a.hasMobilePayment) mobilePaymentCount++;
    });
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Cuentas Bancarias</span>
          <Landmark className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalAccountsCount}
          </span>
          <span className="text-xs text-slate-500">registros activos</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Contactos / Titulares</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {contacts.length}
          </span>
          <span className="text-xs text-slate-500">beneficiarios</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Bancos Asociados</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {uniqueBanks.size}
          </span>
          <span className="text-xs text-slate-500">entidades financieras</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Con Pago Móvil</span>
          <Smartphone className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {mobilePaymentCount}
          </span>
          <span className="text-xs text-slate-500">habilitadas</span>
        </div>
      </div>
    </div>
  );
};
