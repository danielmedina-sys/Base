import React, { useState, useEffect, useRef } from 'react';
import { Contact } from '../types';
import { parseExcelOrCsvFile, parsePastedText, exportToExcel, exportToCsv } from '../utils/excel';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ClipboardPaste
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onImportSuccess: (importedContacts: Contact[], mode: 'merge' | 'replace') => void;
  onResetData: () => void;
  initialFile?: File | null;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onImportSuccess,
  onResetData,
  initialFile,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'paste' | 'export'>('import');
  const [pastedText, setPastedText] = useState(
`,rosana,🔎,,,
01020372430000103334,,,23490380,,roropeza@allstarpublicidad.com
01740149131494043803,ROSANA BEATRIZ OROPEZA RUBIO,BANPLUS,23490380,,`
  );
  const [previewContacts, setPreviewContacts] = useState<Contact[] | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process initial file if passed from drag and drop
  useEffect(() => {
    if (initialFile && isOpen) {
      processFile(initialFile);
    }
  }, [initialFile, isOpen]);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const parsed = await parseExcelOrCsvFile(file);
      if (parsed.length === 0) {
        setStatusMsg({ type: 'error', text: 'No se pudieron reconocer cuentas válidas en el archivo seleccionado.' });
      } else {
        setPreviewContacts(parsed);
        setStatusMsg({
          type: 'success',
          text: `Archivo "${file.name}" analizado con éxito: ${parsed.length} contacto(s) y ${parsed.reduce(
            (acc, c) => acc + c.accounts.length,
            0
          )} cuenta(s) bancaria(s) detectadas. Sin límite de registros.`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error al leer el archivo Excel o CSV. Verifica el formato del documento.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      setStatusMsg({ type: 'error', text: 'Por favor pega las filas o líneas de texto para procesar.' });
      return;
    }

    try {
      const parsed = parsePastedText(pastedText);
      if (parsed.length === 0) {
        setStatusMsg({ type: 'error', text: 'No se pudieron extraer datos válidos del texto pegado.' });
      } else {
        setPreviewContacts(parsed);
        setStatusMsg({
          type: 'success',
          text: `Texto procesado con éxito: ${parsed.length} contacto(s) y ${parsed.reduce(
            (acc, c) => acc + c.accounts.length,
            0
          )} cuenta(s) reconocidas.`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error al interpretar el texto pegado.' });
    }
  };

  const handleConfirmImport = () => {
    if (!previewContacts || previewContacts.length === 0) return;
    onImportSuccess(previewContacts, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Importar y Exportar Base de Datos
              </h2>
              <p className="text-xs text-slate-500">
                Sincroniza tus cuentas con archivos Excel (.xlsx), CSV o texto plano
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/30 gap-6 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('import');
              setStatusMsg(null);
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Archivo (.xlsx / .csv)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setStatusMsg(null);
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Pegar Filas de Excel / Texto</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('export');
              setStatusMsg(null);
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar & Respaldos</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {statusMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/60 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  Haz clic para seleccionar tu archivo Excel o CSV
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Soporta formatos estándar (.xlsx, .xls) y delimitados por coma (.csv). Detecta automáticamente cuentas, bancos y beneficiarios.
                </p>
                {loading && (
                  <p className="text-xs text-blue-600 font-medium mt-3">Procesando archivo...</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block mb-1">
                  Reconocimiento automático de columnas:
                </span>
                <p>
                  El sistema detecta columnas con 20 dígitos (número de cuenta), identifica automáticamente el banco venezolano por sus primeros 4 dígitos (ej: 0102 Banco de Venezuela, 0174 Banplus), agrupa múltiples cuentas de un mismo titular por su cédula o nombre, y extrae correos y teléfonos.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pega directamente las filas de Excel o texto con formato:
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`ejemplo:\n01020372430000103334,,,23490380,,roropeza@allstarpublicidad.com\n01740149131494043803,ROSANA BEATRIZ OROPEZA RUBIO,BANPLUS,23490380,,`}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-3 focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Puedes copiar celdas directamente desde Microsoft Excel o Google Sheets y pegarlas aquí.
                </span>
              </div>

              <button
                onClick={handleParsePasted}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interpretar y Previsualizar Filas</span>
              </button>
            </div>
          )}

          {/* TAB 3: EXPORT & BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900">Descargar en Excel (.xlsx)</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Genera una hoja de cálculo profesional con columnas ajustadas y números de cuenta protegidos en formato texto para que no se trunquen los ceros iniciales.
                    </p>
                  </div>
                  <button
                    onClick={() => exportToExcel(contacts)}
                    className="w-full py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar archivo .xlsx</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900">Descargar en CSV (.csv)</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Archivo de texto plano delimitado por comas con codificación UTF-8 con BOM, compatible con sistemas bancarios y ERPs.
                    </p>
                  </div>
                  <button
                    onClick={() => exportToCsv(contacts)}
                    className="w-full py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar archivo .csv</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Restaurar datos iniciales</h5>
                  <p className="text-[11px] text-slate-500">
                    Vuelve a cargar los datos de ejemplo iniciales (incluyendo el registro de Rosana).
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('¿Deseas restaurar la base de datos a los valores de ejemplo originales?')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Predeterminados</span>
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW TABLE IF PARSED */}
          {previewContacts && previewContacts.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Previsualización de Datos Detectados ({previewContacts.length} contactos)
                </h4>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <span className="text-slate-700 font-medium">Combinar con existentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span className="text-slate-700 font-medium">Reemplazar base actual</span>
                  </label>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2">Titular</th>
                      <th className="p-2">C.I. / RIF</th>
                      <th className="p-2">Banco</th>
                      <th className="p-2">N° Cuenta</th>
                      <th className="p-2">Correo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewContacts.map((c) =>
                      c.accounts.map((acc) => (
                        <tr key={`${c.id}-${acc.id}`} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-800">{c.name}</td>
                          <td className="p-2 font-mono">{c.documentType}-{c.documentNumber}</td>
                          <td className="p-2">{acc.bankName}</td>
                          <td className="p-2 font-mono">{acc.accountNumber}</td>
                          <td className="p-2 text-slate-500">{c.email || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewContacts(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmar e Importar a la Base de Datos</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>{contacts.length} contactos en la base actual</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
