import React, { useState } from 'react';
import { FilterState } from '../types';
import { ALL_BANKS } from '../data/banks';
import { Search, X, SlidersHorizontal, ArrowUpDown, Check } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatches: number;
  totalRecords: number;
}

const POPULAR_BANKS = [
  { label: 'Todos', value: '' },
  { label: 'Banplus', value: 'Banplus' },
  { label: 'BDV', value: 'Venezuela' },
  { label: 'Banesco', value: 'Banesco' },
  { label: 'Mercantil', value: 'Mercantil' },
  { label: 'Provincial', value: 'Provincial' },
  { label: 'BNC', value: 'BNC' },
  { label: 'Bancamiga', value: 'Bancamiga' },
  { label: 'Zelle', value: 'Zelle' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalMatches,
  totalRecords,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const clearSearch = () => {
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
  };

  const handleBankQuickFilter = (bankVal: string) => {
    setFilters((prev) => ({ ...prev, bank: bankVal }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      bank: '',
      category: '',
      accountType: '',
      documentType: '',
      onlyMobilePayment: false,
      currency: '',
      sortBy: 'name_asc',
    });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    Boolean(filters.bank) ||
    Boolean(filters.category) ||
    Boolean(filters.accountType) ||
    Boolean(filters.documentType) ||
    filters.onlyMobilePayment ||
    Boolean(filters.currency) ||
    filters.sortBy !== 'name_asc';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      {/* Top Search Bar & Toggle Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Universal Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar por titular, alias (ej: rosana), cuenta, cédula (ej: 23490380), banco o correo..."
            className="block w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Buttons: Advanced Filters & Sort */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              showAdvanced || hasActiveFilters
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros Avanzados</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-transparent hover:border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Quick Bank Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 font-medium whitespace-nowrap mr-1">
          Bancos rápidos:
        </span>
        {POPULAR_BANKS.map((b) => {
          const isActive =
            (b.value === '' && !filters.bank) ||
            (b.value !== '' && filters.bank.toLowerCase().includes(b.value.toLowerCase()));
          return (
            <button
              key={b.label}
              onClick={() => handleBankQuickFilter(b.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Bank Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Entidad Bancaria
            </label>
            <select
              value={filters.bank}
              onChange={(e) => setFilters((prev) => ({ ...prev, bank: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="">Todos los bancos</option>
              {ALL_BANKS.map((b) => (
                <option key={b.code} value={b.name}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="">Todas las categorías</option>
              <option value="Proveedor">Proveedor</option>
              <option value="Nómina / Empleado">Nómina / Empleado</option>
              <option value="Cliente">Cliente</option>
              <option value="Socio / Directivo">Socio / Directivo</option>
              <option value="Servicios">Servicios</option>
              <option value="Personal">Personal</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo de Cuenta
            </label>
            <select
              value={filters.accountType}
              onChange={(e) => setFilters((prev) => ({ ...prev, accountType: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="">Todos los tipos</option>
              <option value="Corriente">Corriente</option>
              <option value="Ahorro">Ahorro</option>
              <option value="Moneda Extranjera / Dólares">Moneda Extranjera / Dólares</option>
              <option value="Custodia">Custodia</option>
              <option value="Zelle">Zelle</option>
              <option value="Internacional">Internacional</option>
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={filters.documentType}
              onChange={(e) => setFilters((prev) => ({ ...prev, documentType: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="">Todos (V, E, J, G, P)</option>
              <option value="V">V - Venezolano</option>
              <option value="J">J - Jurídico / Empresa</option>
              <option value="E">E - Extranjero</option>
              <option value="G">G - Gubernamental</option>
              <option value="P">P - Pasaporte</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>Ordenar por</span>
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterState['sortBy'],
                }))
              }
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-slate-900 focus:bg-white"
            >
              <option value="name_asc">Titular (A - Z)</option>
              <option value="name_desc">Titular (Z - A)</option>
              <option value="bank_asc">Banco (A - Z)</option>
              <option value="updated_desc">Modificado recientemente</option>
            </select>
          </div>

          {/* Pago Móvil Toggle Checkbox */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={filters.onlyMobilePayment}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, onlyMobilePayment: e.target.checked }))
                }
                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
              />
              <span className="text-xs font-medium text-slate-700">Solo con Pago Móvil</span>
            </label>
          </div>
        </div>
      )}

      {/* Result Counter & Active Filters indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong className="text-slate-800 font-mono tabular-nums">{totalMatches}</strong> de{' '}
            <span className="font-mono tabular-nums">{totalRecords}</span> registros
          </span>
          {filters.searchQuery && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600">
                Coincidencias para &ldquo;<strong className="text-slate-900">{filters.searchQuery}</strong>&rdquo;
              </span>
            </>
          )}
        </div>

        {hasActiveFilters && (
          <div className="text-xs text-slate-600 font-medium">
            Filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
};
