import React from 'react';
import { Flight } from '../types';
import { ArrowLeft, X, Clock, MessageSquare } from 'lucide-react';

interface FlightStripProps {
  flight: Flight;
  onUpdate?: (id: string, field: string | Partial<Flight>, value?: any) => void;
  onMoveRequest?: (id: string) => void;
  onDelete?: (id: string) => void;
  onObsRequest?: (id: string) => void;
  availableRunways?: string[];
  availableTaxiways?: string[];
  activeTwyIn?: string;
  activeTwyOut?: string;
  activeRwyDep?: string;
  activeRwyArr?: string;
  fafs?: string[];
}

function EditableField({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) {
  return (
    <input 
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      onFocus={() => onChange('')}
      className={`bg-transparent outline-none m-0 p-0 uppercase ${className}`}
      style={{ width: `${Math.max(1, value.length)}ch` }}
    />
  );
}

function formatHHMMSS(ms?: number) {
  if (!ms) return '--:--:--';
  const d = new Date(ms);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')}`;
}

function formatDiff(start?: number, end?: number) {
  if (!start || !end) return '---s';
  const diffSecs = Math.floor((end - start) / 1000);
  return `${diffSecs}s`;
}

export function FlightStrip({ 
  flight, 
  onUpdate, 
  onMoveRequest, 
  onDelete, 
  onObsRequest, 
  availableRunways, 
  availableTaxiways = ['A', 'B', 'C', 'D'],
  activeTwyIn,
  activeTwyOut,
  activeRwyDep,
  activeRwyArr,
  fafs = ['', '', 'FAF'] 
}: FlightStripProps) {
  const isDep = flight.type === 'DEP';
  const isArr = flight.type === 'ARR';
  const isHold = flight.type === 'HOLD';
  
  const depCheckpoints = React.useMemo(() => {
    return [
      { key: 'inicioTime', label: 'INÍCIO' },
      { key: 'ingressoTime', label: 'INGRESSO' },
      { key: 'autorizacaoTime', label: 'AUTORIZ.' },
      { key: 'reacaoTime', label: 'REAÇÃO' },
      { key: 'corridaTime', label: 'CORRIDA' }
    ];
  }, []);

  const arrCheckpoints = React.useMemo(() => {
    const cps: { key: keyof Flight, label: string }[] = [];
    if (fafs[0]) cps.push({ key: 'faf2Time', label: `${fafs[0]}NM` });
    if (fafs[1]) cps.push({ key: 'faf1Time', label: `${fafs[1]}NM` });
    cps.push({ key: 'fafTime', label: 'FAF' });
    cps.push({ key: 'thrTime', label: 'THR' });
    cps.push({ key: 'pLivreTime', label: 'P_LIVRE' });
    return cps;
  }, [fafs]);

  let headerColor = 'bg-surface-container';
  if (isDep) headerColor = 'bg-functional-dep';
  if (isArr) headerColor = 'bg-functional-arr';
  if (isHold) headerColor = 'bg-surface-container text-primary';

  const currentRwy = isDep
    ? (flight.runway || activeRwyDep || '')
    : isArr
    ? (flight.runway || activeRwyArr || '')
    : (flight.runway || activeRwyDep || '');

  const handleUpdate = (field: string | Partial<Flight>, val?: any) => {
    if (onUpdate) {
      onUpdate(flight.id, field, val);
    }
  };

  const handleRwyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (availableRunways && availableRunways.length > 0) {
       const validRwys = availableRunways.filter(r => r);
       if (validRwys.length > 0) {
          const currentIndex = validRwys.indexOf(currentRwy);
          const nextIndex = (currentIndex + 1) % validRwys.length;
          handleUpdate('runway', validRwys[nextIndex]);
       }
    }
  };

  const currentTwy = isDep 
    ? (flight.taxiwayIn || flight.taxiway || activeTwyIn || '') 
    : isArr 
    ? (flight.taxiwayOut || flight.taxiway || activeTwyOut || '')
    : (flight.taxiway || activeTwyIn || '');

  const handleTwyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (availableTaxiways && availableTaxiways.length > 0) {
      const validTwys = availableTaxiways.filter(t => t);
      if (validTwys.length > 0) {
        const currentIndex = validTwys.indexOf(currentTwy);
        const nextIndex = (currentIndex + 1) % validTwys.length;
        const newTwy = validTwys[nextIndex];
        if (isDep) {
          handleUpdate({ taxiwayIn: newTwy, taxiway: newTwy });
        } else if (isArr) {
          handleUpdate({ taxiwayOut: newTwy, taxiway: newTwy });
        } else {
          handleUpdate('taxiway', newTwy);
        }
      }
    }
  };

  const handleWakeTurbulenceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sequence = ['S', 'H', 'M', 'L'];
    const currentIndex = sequence.indexOf(flight.wakeTurbulence || '');
    const nextIndex = (currentIndex + 1) % sequence.length;
    handleUpdate('wakeTurbulence', sequence[nextIndex]);
  };

  return (
    <div 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('flightId', flight.id);
      }}
      className={`cursor-pointer transition-transform duration-75 active:scale-[0.98] bg-surface-container-lowest border border-outline-variant flex flex-col`}
    >
      {/* Header containing Callsign, Aircraft, Wake, RWY, and TWY */}
      <div className={`${headerColor} ${!isHold ? 'text-on-primary' : ''} h-8 px-2 flex items-center justify-between gap-1 relative font-data-mono`}>
        <div className="flex items-center gap-1.5 shrink-0">
          <EditableField 
            value={flight.callsign} 
            onChange={(v) => handleUpdate('callsign', v)} 
            className="font-bold text-[15px] tracking-tight" 
          />
          <span className="opacity-40">/</span>
          <EditableField 
            value={flight.aircraft} 
            onChange={(v) => handleUpdate('aircraft', v)} 
            className="font-bold text-[14px] opacity-90" 
          />
        </div>
        
        {/* Center: Observation button */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onObsRequest) {
                onObsRequest(flight.id);
              }
            }}
            className={`hover:bg-black/20 rounded px-1.5 py-1 transition-colors cursor-pointer flex items-center justify-center ${flight.observacao ? 'text-amber-300' : 'opacity-60 hover:opacity-100'}`}
            title={flight.observacao ? `Obs: ${flight.observacao}` : 'Adicionar Observação'}
          >
            <MessageSquare size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1 font-bold text-[12px] shrink-0">
          <button 
            type="button"
            className="hover:bg-black/20 rounded px-1 py-0.5 transition-colors cursor-pointer"
            onClick={handleWakeTurbulenceClick}
            title="Wake Turbulence (S/H/M/L)"
          >
            {flight.wakeTurbulence || '-'}
          </button>

          {!isHold && (
            <>
              <button 
                type="button"
                className="hover:bg-black/20 rounded px-1 py-0.5 transition-colors cursor-pointer flex items-center gap-0.5"
                onClick={handleRwyClick}
                title="Pista (RWY)"
              >
                <span className="text-[10px] opacity-75 font-normal">RWY</span>
                <span>{currentRwy || '-'}</span>
              </button>
              <button 
                type="button"
                className="hover:bg-black/20 rounded px-1 py-0.5 transition-colors cursor-pointer flex items-center gap-0.5"
                onClick={handleTwyClick}
                title="Taxiway (TWY)"
              >
                <span className="text-[10px] opacity-75 font-normal">{isDep ? 'IN' : isArr ? 'OUT' : 'TWY'}</span>
                <span>{currentTwy || '-'}</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="p-1 font-data-mono text-[13px] leading-tight text-on-surface">
        {isHold ? (
          <div className="grid grid-cols-3 gap-2 items-center min-h-[28px]">
            <div></div>
            <div className="flex justify-between items-center w-full px-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveRequest && onMoveRequest(flight.id); }} 
                className="flex items-center justify-center p-0.5 hover:bg-black/20 rounded text-on-surface-variant hover:text-primary transition-colors"
                title="Assign Flight"
              >
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(flight.id); }} 
                className="flex items-center justify-center p-0.5 hover:bg-red-500/20 text-error rounded transition-colors"
                title="Delete Strip"
              >
                <X size={16} />
              </button>
            </div>
            <div></div>
          </div>
        ) : isDep ? (
          <div className="flex flex-row justify-between items-center min-h-[44px] gap-0.5 overflow-x-auto scrollbar-hide px-0.5">
            {depCheckpoints.map((cp, idx) => {
               let prevTime: number | undefined;
               let isFirstFilled = true;
               for (let i = 0; i < idx; i++) {
                 if (flight[depCheckpoints[i].key as keyof Flight]) {
                   prevTime = flight[depCheckpoints[i].key as keyof Flight] as number;
                   isFirstFilled = false;
                 }
               }
               
               const myTime = flight[cp.key as keyof Flight] as number | undefined;
               const displayValue = myTime 
                 ? (isFirstFilled ? formatHHMMSS(myTime) : formatDiff(prevTime, myTime)) 
                 : (isFirstFilled ? '--:--:--' : '---s');

               return (
                 <div 
                   key={cp.key}
                   className="flex flex-col rounded px-1 py-1.5 transition-colors whitespace-nowrap text-center flex-1 cursor-pointer hover:bg-surface-container-high"
                   onClick={(e) => {
                     e.stopPropagation();
                     const updates: any = { [cp.key]: Date.now() };
                     for (let i = idx + 1; i < depCheckpoints.length; i++) {
                       updates[depCheckpoints[i].key] = undefined;
                     }
                     handleUpdate(updates);
                   }}
                 >
                   <span className="text-[9px] text-on-surface-variant mb-0.5">{cp.label}</span>
                   <span className="text-primary font-bold text-[11px]">{displayValue}</span>
                 </div>
               );
            })}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                let lastFilledIndex = -1;
                for (let i = 0; i < depCheckpoints.length; i++) {
                  if (flight[depCheckpoints[i].key as keyof Flight]) {
                    lastFilledIndex = i;
                  }
                }

                const nextIndex = lastFilledIndex + 1;
                if (nextIndex < depCheckpoints.length) {
                  const nextCp = depCheckpoints[nextIndex];
                  handleUpdate(nextCp.key, Date.now());
                } else if (!flight.finished) {
                  handleUpdate('finished', true);
                }
              }}
              className="p-2 sm:p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors flex-shrink-0 shadow-sm ml-1"
              title="Stopwatch"
            >
              <Clock size={18} />
            </button>
          </div>
        ) : isArr ? (
          <div className="flex flex-row justify-between items-center min-h-[44px] gap-0.5 overflow-x-auto scrollbar-hide px-0.5">
            {arrCheckpoints.map((cp, idx) => {
               // Find previous time for diff calculation
               let prevTime: number | undefined;
               let isFirstFilled = true;
               for (let i = 0; i < idx; i++) {
                 if (flight[arrCheckpoints[i].key as keyof Flight]) {
                   prevTime = flight[arrCheckpoints[i].key as keyof Flight] as number;
                   isFirstFilled = false;
                 }
               }
               
               const myTime = flight[cp.key as keyof Flight] as number | undefined;
               const displayValue = myTime 
                 ? (isFirstFilled ? formatHHMMSS(myTime) : formatDiff(prevTime, myTime)) 
                 : (isFirstFilled ? '--:--:--' : '---s');

               const isPLivre = cp.key === 'pLivreTime';
               const isPLivreDisabled = isPLivre && !flight.thrTime;

               return (
                 <div 
                   key={cp.key}
                   className={`flex flex-col rounded px-1 py-1.5 transition-colors whitespace-nowrap text-center flex-1 ${
                     isPLivreDisabled 
                       ? 'opacity-40 cursor-not-allowed' 
                       : 'cursor-pointer hover:bg-surface-container-high'
                   }`}
                   title={isPLivreDisabled ? 'Requer THR marcado' : undefined}
                   onClick={(e) => {
                     e.stopPropagation();
                     // P_LIVRE requires thrTime to be set first
                     if (isPLivreDisabled) return;

                     const updates: any = { [cp.key]: Date.now() };
                     for (let i = idx + 1; i < arrCheckpoints.length; i++) {
                       updates[arrCheckpoints[i].key] = undefined;
                     }
                     handleUpdate(updates);
                   }}
                 >
                   <span className="text-[9px] text-on-surface-variant mb-0.5">{cp.label}</span>
                   <span className="text-primary font-bold text-[11px]">{displayValue}</span>
                 </div>
               );
            })}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Find the highest filled checkpoint index
                let lastFilledIndex = -1;
                for (let i = 0; i < arrCheckpoints.length; i++) {
                  if (flight[arrCheckpoints[i].key as keyof Flight]) {
                    lastFilledIndex = i;
                  }
                }

                const nextIndex = lastFilledIndex + 1;
                if (nextIndex < arrCheckpoints.length) {
                  const nextCp = arrCheckpoints[nextIndex];
                  if (nextCp.key === 'pLivreTime' && !flight.thrTime) {
                    return;
                  }
                  handleUpdate(nextCp.key, Date.now());
                } else if (!flight.finished) {
                  handleUpdate('finished', true);
                }
              }}
              className="p-2 sm:p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors flex-shrink-0 shadow-sm ml-1"
              title="Stopwatch"
            >
              <Clock size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
