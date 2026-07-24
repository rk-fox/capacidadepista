import React, { useEffect, useState } from 'react';
import { Settings, Download, Moon, Sun, Plus, X, LogOut, SlidersHorizontal, Layers, Edit2, Plane, FileSpreadsheet, Users, Lock as LockIcon, Maximize, Minimize } from 'lucide-react';
import { FlightStrip } from './FlightStrip';
import { ExportModal } from './ExportModal';
import { UserManagementModal } from './UserManagementModal';
import { PasswordModal } from './PasswordModal';
import { mockFlights } from '../data';
import { Flight } from '../types';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch, deleteField } from 'firebase/firestore';

interface DashboardProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export function Dashboard({ theme, toggleTheme }: DashboardProps) {
  const [time, setTime] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [operationMode, setOperationMode] = useState<'BOTH' | 'DEP' | 'ARR'>('BOTH');
  const [mobileOpMode, setMobileOpMode] = useState<'DEP' | 'ARR'>('DEP');
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);
  const [activeAsideModal, setActiveAsideModal] = useState<'AD' | 'RWY' | 'TWY' | 'FAF' | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const [ad, setAd] = useState<string>('SBGR');

  const handleLogout = () => {
    signOut(auth);
  };
  const [rwys, setRwys] = useState<string[]>(['09L', '09R', '', '', '', '']);
  const [activeRwyDep, setActiveRwyDep] = useState<string>('09L');
  const [activeRwyArr, setActiveRwyArr] = useState<string>('09R');

  const [twys, setTwys] = useState<string[]>(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  const [activeTwyDep, setActiveTwyDep] = useState<string>('A');
  const [activeTwyArr, setActiveTwyArr] = useState<string>('B');

  const [fafs, setFafs] = useState<string[]>(['', '', '']);

  const handleCycleRwyDep = () => {
    const valid = rwys.filter(Boolean);
    if (valid.length === 0) return;
    const currIdx = valid.indexOf(activeRwyDep);
    const nextIdx = (currIdx + 1) % valid.length;
    setActiveRwyDep(valid[nextIdx]);
  };

  const handleCycleRwyArr = () => {
    const valid = rwys.filter(Boolean);
    if (valid.length === 0) return;
    const currIdx = valid.indexOf(activeRwyArr);
    const nextIdx = (currIdx + 1) % valid.length;
    setActiveRwyArr(valid[nextIdx]);
  };

  const handleCycleTwyDep = () => {
    const valid = twys.filter(Boolean);
    if (valid.length === 0) return;
    const currIdx = valid.indexOf(activeTwyDep);
    const nextIdx = (currIdx + 1) % valid.length;
    setActiveTwyDep(valid[nextIdx]);
  };

  const handleCycleTwyArr = () => {
    const valid = twys.filter(Boolean);
    if (valid.length === 0) return;
    const currIdx = valid.indexOf(activeTwyArr);
    const nextIdx = (currIdx + 1) % valid.length;
    setActiveTwyArr(valid[nextIdx]);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].split('.')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'flights'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flight));
      // Optionally sort them by creation time or whatever makes sense, but they are just rendered in grids
      setFlights(docs);
    });
    return () => unsub();
  }, []);

  const handleAddStrip = () => {
    const newFlight: Flight = {
      id: 'new-' + Date.now(),
      callsign: 'ACFT',
      type: 'HOLD',
      airport: ad,
      squawk: '',
      aircraft: 'ZZZZ',
      wakeTurbulence: 'M',
      level: '',
      route: '',
    };
    setDoc(doc(db, 'flights', newFlight.id), newFlight).catch(console.error);
  };

  const handleUpdateStrip = (id: string, field: string | Partial<Flight>, value?: any) => {
    const flightRef = doc(db, 'flights', id);
    if (typeof field === 'string') {
      updateDoc(flightRef, { [field]: value === undefined ? deleteField() : value }).catch(console.error);
    } else {
      const cleanFields: any = {};
      Object.entries(field).forEach(([k, v]) => {
        cleanFields[k] = v === undefined ? deleteField() : v;
      });
      updateDoc(flightRef, cleanFields).catch(console.error);
    }
  };

  const handleMove = (type: 'DEP' | 'ARR') => {
    if (showMoveModal) {
      const flightToMove = flights.find(f => f.id === showMoveModal);
      if (flightToMove) {
        const updates: any = {
          type,
          runway: type === 'DEP' ? activeRwyDep : activeRwyArr,
          taxiway: type === 'DEP' ? activeTwyDep : activeTwyArr
        };
        if (type === 'DEP') updates.taxiwayIn = activeTwyDep;
        if (type === 'ARR') updates.taxiwayOut = activeTwyArr;

        updateDoc(doc(db, 'flights', showMoveModal), updates).catch(console.error);
      }
      setShowMoveModal(null);
    }
  };

  const handleDeleteStrip = (id: string) => {
    deleteDoc(doc(db, 'flights', id)).catch(console.error);
  };

  const handleDragDrop = (id: string, newType: 'DEP' | 'ARR' | 'HOLD') => {
    const f = flights.find(f => f.id === id);
    if (!f) return;
    
    let updates: Partial<Flight> = { type: newType };
    if (newType === 'DEP') {
      updates = { type: newType, runway: activeRwyDep, taxiwayIn: activeTwyDep, taxiway: activeTwyDep };
    } else if (newType === 'ARR') {
      updates = { type: newType, runway: activeRwyArr, taxiwayOut: activeTwyArr, taxiway: activeTwyArr };
    }
    
    updateDoc(doc(db, 'flights', id), updates).catch(console.error);
  };

  const deps = flights.filter(f => f.type === 'DEP' && !f.finished);
  const arrs = flights.filter(f => f.type === 'ARR' && !f.finished);
  const news = flights.filter(f => f.type === 'HOLD' && !f.finished);

  // Effective mobile mode
  const activeMobileOp = operationMode === 'BOTH' ? mobileOpMode : operationMode;

  return (
    <div className="flex flex-col h-screen w-full bg-surface text-on-surface overflow-hidden selection:bg-primary selection:text-on-primary">
      {/* Header */}
      <header className="h-12 bg-surface-container-highest border-b border-outline-variant flex justify-between items-center px-3 sm:px-4 shrink-0 z-50 relative">
        {/* Left Section */}
        <div className="flex items-center gap-3 w-1/3">
          <span className="font-label-caps font-bold tracking-widest text-primary text-xs hidden lg:inline">
            SISTEMA DE COLETA // CAPACIDADE ATC
          </span>
          <span className="font-label-caps font-bold tracking-widest text-primary text-xs hidden md:inline lg:hidden">
            CAPACIDADE ATC
          </span>

          {/* Quick desktop/tablet mode switcher */}
          <div className="hidden md:flex items-center gap-1 bg-surface-container/60 p-0.5 rounded-lg border border-outline-variant/40">
            <button 
              onClick={() => setOperationMode('BOTH')}
              className={`px-2 py-0.5 rounded text-[10px] font-label-caps transition-colors ${operationMode === 'BOTH' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              AMBOS
            </button>
            <button 
              onClick={() => setOperationMode('DEP')}
              className={`px-2 py-0.5 rounded text-[10px] font-label-caps transition-colors ${operationMode === 'DEP' ? 'bg-functional-dep text-on-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              DEP
            </button>
            <button 
              onClick={() => setOperationMode('ARR')}
              className={`px-2 py-0.5 rounded text-[10px] font-label-caps transition-colors ${operationMode === 'ARR' ? 'bg-functional-arr text-on-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              ARR
            </button>
          </div>
        </div>
        
        {/* Center: Clock */}
        <div className="flex items-center justify-center w-1/3">
           <span className="font-data-mono font-bold text-primary text-[18px] sm:text-[24px] tracking-wider whitespace-nowrap">{time}</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3">
          {/* Desktop/Tablet Header Actions */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            <button onClick={() => setShowExportModal(true)} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors group cursor-pointer" title="Planilha de Coleta e Dados">
              <FileSpreadsheet size={18} />
              <span className="font-label-caps text-[11px] hidden lg:inline">PLANILHA</span>
            </button>
            <button onClick={toggleTheme} className="text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer" title="Toggle Theme">
               {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <button 
            onClick={toggleFullscreen} 
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          {/* Settings Gear Button (Always available, main portal on Mobile) */}
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            title="Configurações e Ferramentas"
          >
            <Settings size={20} />
          </button>
          
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-outline-variant">
            <span className="font-label-caps text-[12px] text-on-surface-variant uppercase">
              {auth.currentUser?.email?.split('@')[0] || 'ALPHA-1'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Aside (Desktop & Tablet) */}
        <aside className="hidden md:flex w-14 lg:w-16 bg-surface-container-low border-r border-outline-variant flex-col items-center py-3 lg:py-4 shrink-0 z-40">
          <div className="flex flex-col gap-2 w-full px-1">
            <SidebarButton 
              icon={<Plane size={18}/>} 
              label="AD" 
              onClick={() => setActiveAsideModal('AD')} 
            />
            <SidebarButton 
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M4 22L8 2" />
                   <path d="M20 22L16 2" />
                   <path d="M12 6L12 10" />
                   <path d="M12 14L12 18" />
                </svg>
              } 
              label="RWY" 
              onClick={() => setActiveAsideModal('RWY')} 
            />
            <SidebarButton 
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M4 18h16" />
                   <path d="M4 6h16" />
                   <path d="M12 6v12" />
                </svg>
              } 
              label="TWY" 
              onClick={() => setActiveAsideModal('TWY')} 
            />
            <SidebarButton 
              icon={<span className="font-bold text-[18px] leading-none">C</span>} 
              label="FAF" 
              onClick={() => setActiveAsideModal('FAF')} 
            />
            <SidebarButton 
              icon={<FileSpreadsheet size={18}/>} 
              label="LOGS" 
              onClick={() => setShowExportModal(true)} 
            />
          </div>

          <div className="mt-auto w-full px-1 space-y-2">
            <button onClick={handleLogout} className="flex flex-col items-center w-full py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors rounded-lg cursor-pointer">
              <LogOut size={18} />
              <span className="font-data-mono text-[9px] mt-1">LOGOUT</span>
            </button>
          </div>
        </aside>
        
        {/* DESKTOP / TABLET WORKSPACE (md and above) */}
        <main className="hidden md:grid flex-1 h-full grid-cols-12 gap-px bg-outline-variant">
          
          {/* Column 1: DEPARTURES (Shown in BOTH or DEP mode) */}
          {(operationMode === 'BOTH' || operationMode === 'DEP') && (
            <section 
              className={`${operationMode === 'BOTH' ? 'col-span-4' : 'col-span-6'} bg-surface flex flex-col overflow-hidden`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('flightId');
                if (id) handleDragDrop(id, 'DEP');
              }}
            >
              <ColumnHeader title="DEPARTURES (DEP)" count={deps.length.toString().padStart(2, '0')} />
              <div className="flex-1 overflow-y-auto p-1 space-y-1 scrollbar-hide">
                {deps.map(f => (
                  <FlightStrip 
                    key={f.id} 
                    flight={f} 
                    onUpdate={handleUpdateStrip} 
                    availableRunways={rwys} 
                    availableTaxiways={twys}
                    activeTwyIn={activeTwyDep}
                    activeTwyOut={activeTwyArr}
                    activeRwyDep={activeRwyDep}
                    activeRwyArr={activeRwyArr}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Column 2: ARRIVALS (Shown in BOTH or ARR mode) */}
          {(operationMode === 'BOTH' || operationMode === 'ARR') && (
            <section 
              className={`${operationMode === 'BOTH' ? 'col-span-4' : 'col-span-6'} bg-surface flex flex-col overflow-hidden`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('flightId');
                if (id) handleDragDrop(id, 'ARR');
              }}
            >
               <ColumnHeader title="ARRIVALS (ARR)" count={arrs.length.toString().padStart(2, '0')} />
               <div className="flex-1 overflow-y-auto p-1 space-y-1 scrollbar-hide">
                {arrs.map(f => (
                  <FlightStrip 
                    key={f.id} 
                    flight={f} 
                    onUpdate={handleUpdateStrip} 
                    availableRunways={rwys} 
                    availableTaxiways={twys}
                    activeTwyIn={activeTwyDep}
                    activeTwyOut={activeTwyArr}
                    activeRwyDep={activeRwyDep}
                    activeRwyArr={activeRwyArr}
                    fafs={fafs} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* Column 3: HOLD STRIPS (Always shown) */}
          <section 
            className={`${
              operationMode === 'BOTH' ? 'col-span-4' : 'col-span-6'
            } bg-surface-container flex flex-col overflow-hidden border-l border-outline-variant`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData('flightId');
              if (id) handleDragDrop(id, 'HOLD');
            }}
          >
            <div className="h-12 bg-surface-container-highest px-4 flex items-center justify-center border-b border-outline-variant shrink-0">
               <button 
                 onClick={handleAddStrip} 
                 className="w-full max-w-[220px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-4 rounded shadow-[0_2px_10px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
               >
                 <Plus size={16} strokeWidth={3} /> 
                 <span className="font-label-caps text-[12px] uppercase tracking-wider">Nova Strip</span>
               </button>
            </div>
            
            <div className="p-1 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
              {news.map(f => (
                <FlightStrip 
                  key={f.id} 
                  flight={f} 
                  onUpdate={handleUpdateStrip} 
                  onMoveRequest={setShowMoveModal} 
                  onDelete={handleDeleteStrip} 
                  availableRunways={rwys} 
                  availableTaxiways={twys}
                  activeTwyIn={activeTwyDep}
                  activeTwyOut={activeTwyArr}
                    activeRwyDep={activeRwyDep}
                    activeRwyArr={activeRwyArr}
                />
              ))}
            </div>

            {/* Column 3 Footer */}
            <div className="h-14 bg-surface-container-highest px-3 flex justify-center items-center border-t border-outline-variant shrink-0 gap-3 font-data-mono overflow-x-auto scrollbar-hide">
               <span className="font-bold text-primary text-[18px] tracking-wider shrink-0">{ad}</span>
               
               <div className="w-[1px] h-7 bg-outline-variant/60 shrink-0"></div>

               {/* DEP Group */}
               <div className="flex items-center gap-1.5 shrink-0">
                 <button 
                   type="button"
                   onClick={handleCycleRwyDep}
                   className="font-bold text-primary hover:bg-surface-container-high px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-outline-variant/50 hover:border-outline-variant text-[14px]"
                   title="Clique para alternar a Pista DEP Padrão"
                 >
                   <span className="text-[9px] text-on-surface-variant font-normal leading-none mt-[1px]">RWY<br/>DEP:</span>
                   <span>{activeRwyDep || '-'}</span>
                 </button>

                 <button 
                   type="button"
                   onClick={handleCycleTwyDep}
                   className="font-bold text-primary hover:bg-surface-container-high px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-outline-variant/50 hover:border-outline-variant text-[14px]"
                   title="Clique para alternar a Taxiway DEP Padrão"
                 >
                   <span className="text-[9px] text-on-surface-variant font-normal leading-none mt-[1px]">TWY<br/>DEP:</span>
                   <span>{activeTwyDep || '-'}</span>
                 </button>
               </div>

               <div className="w-[2px] h-8 bg-outline-variant rounded-full shrink-0"></div>

               {/* ARR Group */}
               <div className="flex items-center gap-1.5 shrink-0">
                 <button 
                   type="button"
                   onClick={handleCycleRwyArr}
                   className="font-bold text-primary hover:bg-surface-container-high px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-outline-variant/50 hover:border-outline-variant text-[14px]"
                   title="Clique para alternar a Pista ARR Padrão"
                 >
                   <span className="text-[9px] text-on-surface-variant font-normal leading-none mt-[1px]">RWY<br/>ARR:</span>
                   <span>{activeRwyArr || '-'}</span>
                 </button>

                 <button 
                   type="button"
                   onClick={handleCycleTwyArr}
                   className="font-bold text-primary hover:bg-surface-container-high px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-outline-variant/50 hover:border-outline-variant text-[14px]"
                   title="Clique para alternar a Taxiway ARR Padrão"
                 >
                   <span className="text-[9px] text-on-surface-variant font-normal leading-none mt-[1px]">TWY<br/>ARR:</span>
                   <span>{activeTwyArr || '-'}</span>
                 </button>
               </div>
            </div>
          </section>
        </main>

        {/* MOBILE RESPONSIVE LAYOUT (below md screen size) */}
        <div className="md:hidden flex-1 flex flex-col h-full bg-surface">
          
          {/* UPPER PART: HOLD STRIPS (Coluna 3) */}
          <section className="h-1/2 flex flex-col bg-surface-container border-b-2 border-outline-variant overflow-hidden">
            <div className="h-11 bg-surface-container-highest px-3 flex items-center justify-between border-b border-outline-variant shrink-0">
               <span className="font-label-caps text-[11px] font-bold text-primary">STRIPS (HOLD)</span>
               <button 
                 onClick={handleAddStrip} 
                 className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded text-[11px] font-label-caps flex items-center gap-1 shadow"
               >
                 <Plus size={14} strokeWidth={3} />
                 <span>STRIP</span>
               </button>
            </div>

            <div className="p-1 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
              {news.length === 0 ? (
                <div className="flex items-center justify-center h-full text-on-surface-variant/50 text-xs italic">
                  Nenhuma nova strip no momento
                </div>
              ) : (
                news.map(f => (
                  <FlightStrip 
                    key={f.id} 
                    flight={f} 
                    onUpdate={handleUpdateStrip} 
                    onMoveRequest={setShowMoveModal} 
                    onDelete={handleDeleteStrip} 
                    availableRunways={rwys} 
                    availableTaxiways={twys}
                    activeTwyIn={activeTwyDep}
                    activeTwyOut={activeTwyArr}
                    activeRwyDep={activeRwyDep}
                    activeRwyArr={activeRwyArr}
                  />
                ))
              )}
            </div>
          </section>

          {/* LOWER PART: DATA COLLECTION (Coluna 1 DEP ou Coluna 2 ARR) */}
          <section className="h-1/2 flex flex-col bg-surface overflow-hidden">
            {/* Operation mode switcher header for mobile */}
            <div className="h-11 bg-surface-container-high px-3 flex items-center justify-between border-b border-outline-variant shrink-0">
              <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant">
                <button
                  onClick={() => setMobileOpMode('DEP')}
                  className={`px-3 py-1 rounded text-[11px] font-label-caps font-bold transition-all ${
                    activeMobileOp === 'DEP' 
                      ? 'bg-functional-dep text-on-primary shadow-sm' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  DEPARTURES ({deps.length})
                </button>
                <button
                  onClick={() => setMobileOpMode('ARR')}
                  className={`px-3 py-1 rounded text-[11px] font-label-caps transition-all ${
                    activeMobileOp === 'ARR' 
                      ? 'bg-functional-arr text-on-primary shadow-sm' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  ARRIVALS ({arrs.length})
                </button>
              </div>

              {/* Quick Cycle RWY/TWY info on mobile */}
              <div className="flex items-center gap-1 font-data-mono text-[11px] text-primary">
                <button onClick={activeMobileOp === 'DEP' ? handleCycleRwyDep : handleCycleRwyArr} className="px-1 py-0.5 rounded hover:bg-surface-container">
                  R:{activeMobileOp === 'DEP' ? activeRwyDep : activeRwyArr}
                </button>
                <button onClick={activeMobileOp === 'DEP' ? handleCycleTwyDep : handleCycleTwyArr} className="px-1 py-0.5 rounded hover:bg-surface-container">
                  T:{activeMobileOp === 'DEP' ? activeTwyDep : activeTwyArr}
                </button>
              </div>
            </div>

            {/* List for Active Operational Strips */}
            <div className="p-1 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
              {activeMobileOp === 'DEP' ? (
                deps.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-on-surface-variant/50 text-xs italic">
                    Nenhuma decolagem pendente
                  </div>
                ) : (
                  deps.map(f => (
                    <FlightStrip 
                      key={f.id} 
                      flight={f} 
                      onUpdate={handleUpdateStrip} 
                      availableRunways={rwys} 
                      availableTaxiways={twys}
                      activeTwyIn={activeTwyDep}
                      activeTwyOut={activeTwyArr}
                    activeRwyDep={activeRwyDep}
                    activeRwyArr={activeRwyArr}
                    />
                  ))
                )
              ) : (
                arrs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-on-surface-variant/50 text-xs italic">
                    Nenhum pouso pendente
                  </div>
                ) : (
                  arrs.map(f => (
                    <FlightStrip 
                      key={f.id} 
                      flight={f} 
                      onUpdate={handleUpdateStrip} 
                      availableRunways={rwys} 
                      availableTaxiways={twys}
                      activeTwyIn={activeTwyDep}
                      activeTwyOut={activeTwyArr}
                    activeRwyDep={activeRwyDep}
                    activeRwyArr={activeRwyArr}
                      fafs={fafs} 
                    />
                  ))
                )
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Settings Gear Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-highest border border-outline-variant rounded-2xl shadow-2xl flex flex-col max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-primary" />
                <h3 className="font-label-caps font-bold text-primary text-base">CONFIGURAÇÕES DO SISTEMA</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              {/* Modo de Operação */}
              <div className="space-y-2">
                <label className="text-xs font-label-caps text-on-surface-variant font-bold tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" /> MODO DE EXIBIÇÃO / OPERAÇÃO
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-surface-container rounded-xl border border-outline-variant">
                  <button
                    onClick={() => setOperationMode('BOTH')}
                    className={`py-2 px-2 rounded-lg font-label-caps text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      operationMode === 'BOTH' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    <span>AMBOS</span>
                    <span className="text-[9px] opacity-80 font-normal">DEP + ARR</span>
                  </button>
                  <button
                    onClick={() => { setOperationMode('DEP'); setMobileOpMode('DEP'); }}
                    className={`py-2 px-2 rounded-lg font-label-caps text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      operationMode === 'DEP' ? 'bg-functional-dep text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    <span>SÓ DEP</span>
                    <span className="text-[9px] opacity-80 font-normal">Decolagens</span>
                  </button>
                  <button
                    onClick={() => { setOperationMode('ARR'); setMobileOpMode('ARR'); }}
                    className={`py-2 px-2 rounded-lg font-label-caps text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      operationMode === 'ARR' ? 'bg-functional-arr text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    <span>SÓ ARR</span>
                    <span className="text-[9px] opacity-80 font-normal">Pousos</span>
                  </button>
                </div>
              </div>

              {/* Configurações Operacionais */}
              <div className="space-y-2">
                <label className="text-xs font-label-caps text-on-surface-variant font-bold tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-primary" /> PARÂMETROS DE PISTA E PÁTIO
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveAsideModal('AD')}
                    className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-label-caps text-on-surface-variant">AERÓDROMO</div>
                      <div className="font-data-mono font-bold text-primary text-base">{ad}</div>
                    </div>
                    <Edit2 size={16} className="text-on-surface-variant" />
                  </button>

                  <button
                    onClick={() => setActiveAsideModal('RWY')}
                    className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-label-caps text-on-surface-variant">PISTAS (RWY)</div>
                      <div className="font-data-mono font-bold text-primary text-xs truncate max-w-[90px]">
                        {rwys.filter(Boolean).join(', ') || 'Nenhuma'}
                      </div>
                    </div>
                    <Edit2 size={16} className="text-on-surface-variant" />
                  </button>

                  <button
                    onClick={() => setActiveAsideModal('TWY')}
                    className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-label-caps text-on-surface-variant">TAXIWAYS (TWY)</div>
                      <div className="font-data-mono font-bold text-primary text-xs truncate max-w-[90px]">
                        {twys.filter(Boolean).join(', ') || 'Nenhuma'}
                      </div>
                    </div>
                    <Edit2 size={16} className="text-on-surface-variant" />
                  </button>

                  <button
                    onClick={() => setActiveAsideModal('FAF')}
                    className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-label-caps text-on-surface-variant">PONTOS FAF</div>
                      <div className="font-data-mono font-bold text-primary text-xs truncate max-w-[90px]">
                        {fafs.filter(Boolean).join(', ') || 'FAF Padrão'}
                      </div>
                    </div>
                    <Edit2 size={16} className="text-on-surface-variant" />
                  </button>
                </div>
              </div>

              {/* Ferramentas e Tema */}
              <div className="space-y-2 pt-2 border-t border-outline-variant">
                <label className="text-xs font-label-caps text-on-surface-variant font-bold tracking-wider">
                  SISTEMA E DADOS
                </label>
                <div className="space-y-2">
                  <button
                    onClick={toggleTheme}
                    className="w-full p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
                      <span className="font-label-caps text-xs font-bold">TEMA DA INTERFACE</span>
                    </div>
                    <span className="font-data-mono text-xs text-primary font-bold uppercase">{theme}</span>
                  </button>

                  <button
                    onClick={() => { setShowExportModal(true); setShowSettingsModal(false); }}
                    className="w-full p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-primary" />
                      <span className="font-label-caps text-xs font-bold">PLANILHA DE COLETA (LOGS)</span>
                    </div>
                  </button>

                  <div className="pt-2"></div>
                  <label className="text-xs font-label-caps text-on-surface-variant font-bold tracking-wider">
                    CONTA E SEGURANÇA
                  </label>
                  
                  <button
                    onClick={() => { setShowUserModal(true); setShowSettingsModal(false); }}
                    className="w-full p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Users size={18} />
                      <span className="font-label-caps text-xs font-bold">GERENCIAR USUÁRIOS</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowPasswordModal(true); setShowSettingsModal(false); }}
                    className="w-full p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <LockIcon size={18} />
                      <span className="font-label-caps text-xs font-bold">ALTERAR SENHA</span>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full p-3 bg-surface-container hover:bg-error/20 border border-outline-variant hover:border-error/50 rounded-xl transition-colors flex items-center justify-between text-error"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={18} />
                      <span className="font-label-caps text-xs font-bold">ENCERRAR SESSÃO</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-primary text-on-primary font-label-caps font-bold px-6 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity"
              >
                CONCLUÍDO
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showExportModal && (
         <ExportModal 
           onClose={() => setShowExportModal(false)} 
           flights={flights}
           onUpdateFlight={handleUpdateStrip}
           onDeleteFlight={handleDeleteStrip}
           onClearFlights={async (ids) => {
             const batch = writeBatch(db);
             ids.forEach(id => {
               batch.delete(doc(db, 'flights', id));
             });
             await batch.commit().catch(console.error);
           }}
         />
      )}

      {showMoveModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-6 w-[300px]">
               <h3 className="font-label-caps text-primary text-center">ASSIGN STRIP</h3>
               <div className="flex gap-4">
                  <button onClick={() => handleMove('DEP')} className="flex-1 py-3 bg-functional-dep hover:opacity-90 text-on-primary font-bold rounded-lg shadow-lg transition-opacity">DEP</button>
                  <button onClick={() => handleMove('ARR')} className="flex-1 py-3 bg-functional-arr hover:opacity-90 text-on-primary font-bold rounded-lg shadow-lg transition-opacity">ARR</button>
               </div>
               <button onClick={() => setShowMoveModal(null)} className="mt-2 text-on-surface-variant hover:text-primary font-label-caps text-[10px]">CANCEL</button>
            </div>
         </div>
      )}

      {activeAsideModal === 'AD' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-4 w-[320px]">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-label-caps text-primary text-sm">AERÓDROMO</h3>
               <button onClick={() => setActiveAsideModal(null)} className="text-on-surface-variant hover:text-primary"><X size={16}/></button>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-label-caps text-on-surface-variant">QUADRIGRAMA</label>
               <input 
                 type="text" 
                 value={ad}
                 onChange={(e) => setAd(e.target.value.toUpperCase())}
                 maxLength={4} 
                 className="w-full bg-surface-container/50 border border-outline-variant p-3 font-data-mono text-primary uppercase outline-none focus:border-primary/50 rounded-lg text-center tracking-widest text-lg" 
                 placeholder="ZZZZ" 
               />
            </div>
            <button onClick={() => setActiveAsideModal(null)} className="mt-2 w-full bg-primary text-on-primary py-2 rounded-lg font-label-caps font-bold">SALVAR</button>
          </div>
        </div>
      )}

      {activeAsideModal === 'RWY' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-4 w-[400px]">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-label-caps text-primary text-sm">RUNWAY CONFIGURATION</h3>
               <button onClick={() => setActiveAsideModal(null)} className="text-on-surface-variant hover:text-primary"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {[0,1,2,3,4,5].map(i => (
                 <div key={i} className="space-y-1">
                   <label className="text-[10px] font-label-caps text-on-surface-variant flex gap-1">
                     RWY {i+1} {i <= 1 ? <span className="text-error">*</span> : ''}
                   </label>
                   <input 
                     type="text" 
                     value={rwys[i]}
                     onChange={(e) => {
                       const newRwys = [...rwys];
                       newRwys[i] = e.target.value.toUpperCase();
                       setRwys(newRwys);
                       if (i === 0 && !activeRwyDep) setActiveRwyDep(newRwys[0]);
                       if (i === 0 && !activeRwyArr) setActiveRwyArr(newRwys[0]);
                     }}
                     maxLength={3} 
                     required={i <= 1} 
                     className="w-full bg-surface-container/50 border border-outline-variant p-2 font-data-mono text-primary uppercase outline-none focus:border-primary/50 rounded-lg text-center" 
                   />
                 </div>
               ))}
            </div>
            <button onClick={() => {
              if (!rwys.includes(activeRwyDep)) setActiveRwyDep(rwys.find(r => r) || '');
              if (!rwys.includes(activeRwyArr)) setActiveRwyArr(rwys.find(r => r) || '');
              setActiveAsideModal(null);
            }} className="mt-2 w-full bg-primary text-on-primary py-2 rounded-lg font-label-caps font-bold">SALVAR CONFIG</button>
          </div>
        </div>
      )}

      {activeAsideModal === 'TWY' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-4 w-[420px]">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-label-caps text-primary text-sm">TAXIWAY CONFIGURATION</h3>
               <button onClick={() => setActiveAsideModal(null)} className="text-on-surface-variant hover:text-primary"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
               {[0,1,2,3,4,5,6,7].map(i => (
                 <div key={i} className="space-y-1">
                   <label className="text-[10px] font-label-caps text-on-surface-variant flex gap-1">
                     TWY {i+1}
                   </label>
                   <input 
                     type="text" 
                     value={twys[i] || ''}
                     onChange={(e) => {
                       const newTwys = [...twys];
                       newTwys[i] = e.target.value.toUpperCase();
                       setTwys(newTwys);
                     }}
                     maxLength={2} 
                     className="w-full bg-surface-container/50 border border-outline-variant p-2 font-data-mono text-primary uppercase outline-none focus:border-primary/50 rounded-lg text-center font-bold" 
                     placeholder={`T${i+1}`}
                   />
                 </div>
               ))}
            </div>
            <button onClick={() => {
              if (!twys.includes(activeTwyDep)) setActiveTwyDep(twys.find(t => t) || '');
              if (!twys.includes(activeTwyArr)) setActiveTwyArr(twys.find(t => t) || '');
              setActiveAsideModal(null);
            }} className="mt-2 w-full bg-primary text-on-primary py-2 rounded-lg font-label-caps font-bold">SALVAR CONFIG</button>
          </div>
        </div>
      )}

      {activeAsideModal === 'FAF' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-4 w-[320px]">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-label-caps text-primary text-sm">FINAL APPROACH FIX</h3>
               <button onClick={() => setActiveAsideModal(null)} className="text-on-surface-variant hover:text-primary"><X size={16}/></button>
            </div>
            <div className="flex gap-2">
               {['FAF2', 'FAF 1', 'FAF'].map((label, idx) => (
                 <div key={label} className="space-y-1 flex-1">
                   <label className="text-[10px] font-label-caps text-on-surface-variant flex gap-1">
                     {label} {idx === 2 ? <span className="text-error">*</span> : ''}
                   </label>
                   <input 
                     type="text" 
                     maxLength={3} 
                     value={fafs[idx]}
                     onChange={(e) => {
                       const newFafs = [...fafs];
                       newFafs[idx] = e.target.value;
                       setFafs(newFafs);
                     }}
                     required={idx === 2} 
                     className="w-full bg-surface-container/50 border border-outline-variant p-3 font-data-mono text-primary outline-none focus:border-primary/50 rounded-lg text-center text-lg uppercase" 
                     placeholder={idx === 2 ? "FAF" : "00"} 
                   />
                 </div>
               ))}
            </div>
            <button onClick={() => setActiveAsideModal(null)} className="mt-2 w-full bg-primary text-on-primary py-2 rounded-lg font-label-caps font-bold">APLICAR</button>
          </div>
        </div>
      )}
      {showUserModal && (
        <UserManagementModal onClose={() => setShowUserModal(false)} />
      )}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

function ColumnHeader({ title, count }: { title: string, count: string }) {
  return (
    <div className="h-8 bg-surface-container-high px-2 flex items-center justify-between border-b border-outline-variant shrink-0 font-data-mono">
      <h2 className="font-label-caps text-[11px] text-primary">{title}</h2>
      <span className="text-[12px] text-on-surface-variant font-bold">{count}</span>
    </div>
  );
}

function SidebarButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center py-2 w-full transition-colors cursor-pointer rounded-lg ${
      active 
        ? 'bg-secondary-container text-on-secondary-container border-l-2 border-secondary scale-95 duration-75' 
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
    }`}>
      {icon}
      <span className="font-data-mono text-[9px] mt-1 tracking-wider">{label}</span>
    </button>
  );
}
