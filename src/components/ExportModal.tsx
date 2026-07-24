import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Copy, Check, Search, Filter, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { Flight } from '../types';

interface ExportModalProps {
  onClose: () => void;
  flights: Flight[];
  onUpdateFlight?: (id: string, field: string | Partial<Flight>, value?: any) => void;
  onDeleteFlight?: (id: string) => void;
  onClearFlights?: (ids: string[]) => void;
}

function formatHHMMSS(ms?: number) {
  if (!ms) return '';
  const d = new Date(ms);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const s = d.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function ExportModal({ onClose, flights, onUpdateFlight, onDeleteFlight, onClearFlights }: ExportModalProps) {
  const [filterMode, setFilterMode] = useState<'FINISHED' | 'ALL'>('FINISHED');
  const [opFilter, setOpFilter] = useState<'ALL' | 'DEP' | 'ARR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<Flight | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter flights based on mode and search
  const displayedFlights = flights.filter(f => {
    // Finished filter
    if (filterMode === 'FINISHED' && !f.finished) {
      return false;
    }
    // Operation filter
    if (opFilter !== 'ALL' && f.type !== opFilter) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCallsign = f.callsign.toLowerCase().includes(q);
      const matchAircraft = f.aircraft.toLowerCase().includes(q);
      const matchAirport = f.airport.toLowerCase().includes(q);
      const matchRwy = (f.runway || '').toLowerCase().includes(q);
      return matchCallsign || matchAircraft || matchAirport || matchRwy;
    }
    return true;
  });

  // Table row generator matching requested columns:
  // Indicativo, tipo, esteira, AD, RWY, táxi, operação, ingresso, corrida, faf2, faf1, faf, thr, p_livre, obs
  const getRowData = (f: Flight) => {
    const isDep = f.type === 'DEP';
    const isArr = f.type === 'ARR';

    const taxi = isDep 
      ? (f.taxiwayIn || f.taxiway || '') 
      : isArr 
      ? (f.taxiwayOut || f.taxiway || '') 
      : (f.taxiway || '');

    const ingresso = isDep && f.ingressoTime ? formatHHMMSS(f.ingressoTime) : '';
    const corrida = isDep && f.corridaTime ? formatHHMMSS(f.corridaTime) : '';

    const faf2 = isArr && f.faf2Time ? formatHHMMSS(f.faf2Time) : '';
    const faf1 = isArr && f.faf1Time ? formatHHMMSS(f.faf1Time) : '';
    const faf = isArr && f.fafTime ? formatHHMMSS(f.fafTime) : '';
    const thr = isArr && f.thrTime ? formatHHMMSS(f.thrTime) : '';
    const pLivre = isArr && f.pLivreTime ? formatHHMMSS(f.pLivreTime) : '';

    let obs = '';
    if (isDep && f.reacaoTime) {
      obs = `Reação: ${formatHHMMSS(f.reacaoTime)}`;
    }

    return {
      indicativo: f.callsign || '',
      tipo: f.aircraft || '',
      esteira: f.wakeTurbulence || '',
      ad: f.airport || '',
      rwy: f.runway || '',
      taxi,
      operacao: f.type || '',
      ingresso,
      corrida,
      faf2,
      faf1,
      faf,
      thr,
      pLivre,
      obs
    };
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Indicativo', 'Tipo', 'Esteira', 'AD', 'RWY', 'Táxi', 'Operação',
      'Ingresso', 'Corrida', 'FAF2', 'FAF1', 'FAF', 'THR', 'P_LIVRE', 'OBS'
    ];

    const rows = displayedFlights.map(f => {
      const d = getRowData(f);
      return [
        d.indicativo,
        d.tipo,
        d.esteira,
        d.ad,
        d.rwy,
        d.taxi,
        d.operacao,
        d.ingresso,
        d.corrida,
        d.faf2,
        d.faf1,
        d.faf,
        d.thr,
        d.pLivre,
        `"${d.obs.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(";"),
      ...rows.map(r => r.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `planilha_trafegos_atc_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard as TSV (pasteable directly into Excel / Google Sheets)
  const handleCopyClipboard = () => {
    const headers = [
      'Indicativo', 'Tipo', 'Esteira', 'AD', 'RWY', 'Táxi', 'Operação',
      'Ingresso', 'Corrida', 'FAF2', 'FAF1', 'FAF', 'THR', 'P_LIVRE', 'OBS'
    ];

    const rows = displayedFlights.map(f => {
      const d = getRowData(f);
      return [
        d.indicativo, d.tipo, d.esteira, d.ad, d.rwy, d.taxi, d.operacao,
        d.ingresso, d.corrida, d.faf2, d.faf1, d.faf, d.thr, d.pLivre, d.obs
      ].join("\t");
    });

    const textToCopy = [headers.join("\t"), ...rows].join("\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-7xl h-[92vh] bg-surface-bright rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-primary tracking-wide">
                  COLETA DE DADOS // PLANILHA DE TRÁFEGOS
                </h2>
                <p className="text-xs text-on-surface-variant font-data-mono">
                  {displayedFlights.length} tráfego(s) na visualização atual
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleCopyClipboard}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-label-caps flex items-center gap-2 transition-all cursor-pointer ${
                copied 
                  ? 'bg-functional-dep text-white' 
                  : 'bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface'
              }`}
              title="Copiar dados para colar no Excel/Google Sheets"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copiado!' : 'Copiar Tabela'}</span>
            </button>

            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 rounded-xl text-xs font-bold font-label-caps flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/20"
            >
              <Download size={16} />
              <span>Baixar Excel / CSV</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-2 bg-surface-container hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors cursor-pointer ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3 sm:p-4 bg-surface-container-low border-b border-outline-variant flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant">
              <button
                onClick={() => setFilterMode('FINISHED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-label-caps transition-all cursor-pointer ${
                  filterMode === 'FINISHED'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Apenas Finalizados
              </button>
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-label-caps transition-all cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Todos os Tráfegos
              </button>
            </div>

            {/* Operation Type Filter */}
            <div className="flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant">
              <button
                onClick={() => setOpFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-label-caps transition-all cursor-pointer ${
                  opFilter === 'ALL'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                TODOS
              </button>
              <button
                onClick={() => setOpFilter('DEP')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-label-caps transition-all cursor-pointer ${
                  opFilter === 'DEP'
                    ? 'bg-functional-dep text-white'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                DEP
              </button>
              <button
                onClick={() => setOpFilter('ARR')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-label-caps transition-all cursor-pointer ${
                  opFilter === 'ARR'
                    ? 'bg-functional-arr text-white'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                ARR
              </button>
            </div>
          </div>

          {/* Search Box & Clear Table Button */}
          <div className="flex items-center gap-2 flex-1 max-w-md min-w-[220px]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60" />
              <input 
                type="text" 
                placeholder="Buscar indicativo, ACFT, RWY..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-9 pr-3 py-1.5 text-xs font-data-mono outline-none focus:border-primary transition-colors text-on-surface"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              disabled={displayedFlights.length === 0}
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold font-label-caps flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-error/10 hover:bg-error/20 text-error border border-error/30 shrink-0"
              title="Apagar todos os registros da tabela atual"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Limpar Tabela</span>
            </button>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="flex-1 overflow-auto bg-surface font-data-mono text-xs">
          {displayedFlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
              <FileSpreadsheet size={48} className="mb-3 opacity-30 text-primary" />
              <p className="font-bold text-base text-on-surface mb-1">Nenhum tráfego encontrado</p>
              <p className="text-xs">
                {filterMode === 'FINISHED' 
                  ? 'Processe e finalize as strips na tela principal para popular este registro.' 
                  : 'Nenhum registro corresponde aos filtros selecionados.'}
              </p>
            </div>
          ) : (
            <div className="min-w-[1150px] border-b border-outline-variant">
              {/* Table Header */}
              <div className="sticky top-0 z-10 bg-surface-container-highest border-b border-outline-variant grid grid-cols-[100px_60px_60px_50px_50px_50px_75px_75px_75px_75px_75px_75px_75px_75px_160px_60px] font-bold text-primary uppercase text-[11px] py-2.5 px-3 tracking-wider shadow-sm">
                <div>Indicativo</div>
                <div>Tipo</div>
                <div>Esteira</div>
                <div>AD</div>
                <div>RWY</div>
                <div>Táxi</div>
                <div>Operação</div>
                <div>Ingresso</div>
                <div>Corrida</div>
                <div>FAF2</div>
                <div>FAF1</div>
                <div>FAF</div>
                <div>THR</div>
                <div>P_LIVRE</div>
                <div>OBS</div>
                <div className="text-center">AÇÃO</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-outline-variant/30">
                {displayedFlights.map((f, idx) => {
                  const d = getRowData(f);
                  const isDep = f.type === 'DEP';
                  const isArr = f.type === 'ARR';

                  return (
                    <div 
                      key={f.id}
                      className={`grid grid-cols-[100px_60px_60px_50px_50px_50px_75px_75px_75px_75px_75px_75px_75px_75px_160px_60px] items-center py-2.5 px-3 hover:bg-surface-container-high/60 transition-colors ${
                        idx % 2 === 0 ? 'bg-surface/40' : 'bg-surface-container-lowest/30'
                      }`}
                    >
                      {/* Indicativo */}
                      <div className="font-bold text-primary text-[13px]">
                        {d.indicativo}
                      </div>

                      {/* Tipo */}
                      <div className="text-on-surface font-semibold">
                        {d.tipo}
                      </div>

                      {/* Esteira */}
                      <div className="text-on-surface-variant font-bold">
                        {d.esteira || '-'}
                      </div>

                      {/* AD */}
                      <div className="text-on-surface-variant">
                        {d.ad}
                      </div>

                      {/* RWY */}
                      <div className="font-bold text-on-surface">
                        {d.rwy || '-'}
                      </div>

                      {/* Táxi */}
                      <div className="text-on-surface">
                        {d.taxi || '-'}
                      </div>

                      {/* Operação */}
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDep 
                            ? 'bg-functional-dep/20 text-functional-dep border border-functional-dep/30' 
                            : isArr 
                            ? 'bg-functional-arr/20 text-functional-arr border border-functional-arr/30' 
                            : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {d.operacao}
                        </span>
                      </div>

                      {/* Ingresso (DEP) */}
                      <div className={d.ingresso ? 'text-primary font-semibold' : 'text-outline'}>
                        {d.ingresso || ''}
                      </div>

                      {/* Corrida (DEP) */}
                      <div className={d.corrida ? 'text-primary font-bold' : 'text-outline'}>
                        {d.corrida || ''}
                      </div>

                      {/* FAF2 (ARR) */}
                      <div className={d.faf2 ? 'text-primary' : 'text-outline'}>
                        {d.faf2 || ''}
                      </div>

                      {/* FAF1 (ARR) */}
                      <div className={d.faf1 ? 'text-primary' : 'text-outline'}>
                        {d.faf1 || ''}
                      </div>

                      {/* FAF (ARR) */}
                      <div className={d.faf ? 'text-primary' : 'text-outline'}>
                        {d.faf || ''}
                      </div>

                      {/* THR (ARR) */}
                      <div className={d.thr ? 'text-primary font-semibold' : 'text-outline'}>
                        {d.thr || ''}
                      </div>

                      {/* P_LIVRE (ARR) */}
                      <div className={d.pLivre ? 'text-primary font-bold' : 'text-outline'}>
                        {d.pLivre || ''}
                      </div>

                      {/* OBS */}
                      <div className="text-on-surface font-medium text-xs truncate pr-2" title={d.obs || ''}>
                        {d.obs ? (
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-bold border border-outline-variant/60 inline-block">
                            {d.obs}
                          </span>
                        ) : (
                          <span className="text-outline">-</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-1">
                        {onUpdateFlight && f.finished && (
                          <button
                            onClick={() => onUpdateFlight(f.id, 'finished', false)}
                            className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Restaurar para Strips Ativas"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setFlightToDelete(f)}
                          className="p-1 hover:bg-error/20 rounded text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Excluir Registro da Tabela"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-3 sm:p-4 bg-surface-container-lowest border-t border-outline-variant flex flex-wrap justify-between items-center text-xs text-on-surface-variant gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-data-mono">
              Total Exibido: <strong className="text-primary">{displayedFlights.length}</strong>
            </span>
            <span className="font-data-mono">
              DEPs: <strong className="text-functional-dep">{displayedFlights.filter(f => f.type === 'DEP').length}</strong>
            </span>
            <span className="font-data-mono">
              ARRs: <strong className="text-functional-arr">{displayedFlights.filter(f => f.type === 'ARR').length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal: Delete Single Flight */}
      {flightToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-bright rounded-2xl border border-outline-variant shadow-2xl p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-error/15 text-error rounded-full mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2 font-label-caps tracking-wide">
              EXCLUIR REGISTRO
            </h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed font-data-mono">
              Deseja realmente remover o tráfego <strong className="text-primary font-bold">{flightToDelete.callsign}</strong> ({flightToDelete.aircraft || 'ACFT'} - {flightToDelete.type})? Os dados desta coleta serão apagados.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setFlightToDelete(null)}
                className="flex-1 py-2.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer font-label-caps"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onDeleteFlight) {
                    onDeleteFlight(flightToDelete.id);
                  }
                  setFlightToDelete(null);
                }}
                className="flex-1 py-2.5 bg-error text-white hover:bg-error/90 text-xs font-bold rounded-xl transition-all cursor-pointer font-label-caps shadow-md shadow-error/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Entire Table */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-bright rounded-2xl border border-outline-variant shadow-2xl p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-error/15 text-error rounded-full mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2 font-label-caps tracking-wide">
              LIMPAR TODA A TABELA
            </h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed font-data-mono">
              Você tem certeza que deseja excluir os <strong className="text-error font-bold">{displayedFlights.length}</strong> registro(s) exibidos nesta planilha? Esta ação é irreversível.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer font-label-caps"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const ids = displayedFlights.map(f => f.id);
                  if (onClearFlights) {
                    onClearFlights(ids);
                  } else if (onDeleteFlight) {
                    ids.forEach(id => onDeleteFlight(id));
                  }
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 bg-error text-white hover:bg-error/90 text-xs font-bold rounded-xl transition-all cursor-pointer font-label-caps shadow-md shadow-error/20"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
