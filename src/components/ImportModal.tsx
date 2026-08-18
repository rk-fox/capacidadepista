import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Flight } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (flights: Partial<Flight>[]) => void;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [previewFlights, setPreviewFlights] = useState<Partial<Flight>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      let indicativoCol = -1;
      let equipCol = -1;
      let estCol = -1;
      let headerRowIndex = -1;

      for (let i = 0; i < Math.min(rows.length, 60); i++) {
        const row = rows[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').trim().toLowerCase();
          if (cell === 'indicativo') indicativoCol = j;
          if (cell === 'equip.' || cell === 'equipamento') equipCol = j;
          if (cell === 'est.' || cell === 'esteira') estCol = j;
        }
        if (indicativoCol !== -1 && equipCol !== -1 && estCol !== -1) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        indicativoCol = 3;
        equipCol = 40;
        estCol = 47;
        headerRowIndex = 34; // default based on screenshot
      }

      const flights: Partial<Flight>[] = [];
      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[indicativoCol]) continue;
        
        const callsign = String(row[indicativoCol]).trim().toUpperCase();
        if (callsign === '' || callsign.length < 3) continue;
        if (callsign.toLowerCase().includes('indicativo')) continue;
        
        const aircraft = String(row[equipCol] || 'ZZZZ').trim().toUpperCase();
        const wakeTurbulence = String(row[estCol] || 'M').trim().toUpperCase();

        flights.push({
          id: 'import-' + Date.now() + '-' + i,
          callsign,
          aircraft,
          wakeTurbulence,
          type: 'HOLD',
          airport: '',
          level: '',
          route: ''
        });
      }
      setPreviewFlights(flights);
    } catch (e) {
      console.error(e);
      alert('Erro ao processar o arquivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    processExcel(file);
  };

  const handleConfirm = () => {
    if (previewFlights) {
      onImport(previewFlights);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-6 w-full max-w-2xl max-h-[90vh]">
        
        <div className="flex justify-between items-center border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <UploadCloud size={24} />
            </div>
            <div>
              <h3 className="font-label-caps font-bold text-primary text-lg">IMPORTAR TRÁFEGOS</h3>
              <p className="text-xs text-on-surface-variant">Importe planilhas (Excel) de relatórios.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-container-high rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {!previewFlights ? (
            <div 
              className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-surface-container/50 transition-all cursor-pointer h-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={48} className="text-primary opacity-80" />
              <div className="text-center">
                <p className="font-bold text-on-surface text-base">Clique para selecionar o arquivo</p>
                <p className="text-xs text-on-surface-variant mt-1">Suporta .xlsx, .xls ou .csv</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileUpload}
              />
              {loading && <p className="text-primary font-bold text-sm animate-pulse mt-4">Processando arquivo...</p>}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-primary">Visualização Prévia ({previewFlights.length} encontrados)</span>
                <button onClick={() => setPreviewFlights(null)} className="text-xs text-on-surface-variant hover:text-error underline">Cancelar arquivo</button>
              </div>
              
              {previewFlights.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container rounded-xl">
                  <AlertTriangle size={32} className="mb-2 opacity-50" />
                  <p>Nenhum tráfego foi identificado no arquivo.</p>
                </div>
              ) : (
                <div className="flex-1 bg-surface-container rounded-xl border border-outline-variant overflow-y-auto">
                  <table className="w-full text-left text-xs font-data-mono">
                    <thead className="bg-surface-container-high sticky top-0">
                      <tr>
                        <th className="p-2 text-on-surface-variant">Indicativo</th>
                        <th className="p-2 text-on-surface-variant">Equip.</th>
                        <th className="p-2 text-on-surface-variant">Esteira</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {previewFlights.map(f => (
                        <tr key={f.id} className="hover:bg-surface-container-high/50">
                          <td className="p-2 font-bold text-primary">{f.callsign}</td>
                          <td className="p-2">{f.aircraft}</td>
                          <td className="p-2">{f.wakeTurbulence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {previewFlights && previewFlights.length > 0 && (
          <div className="flex gap-3 pt-4 border-t border-outline-variant">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface font-bold rounded-xl transition-all font-label-caps"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-primary text-on-primary hover:opacity-90 font-bold rounded-xl transition-all font-label-caps flex items-center justify-center gap-2 shadow-md"
            >
              <Check size={18} /> Confirmar Importação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
