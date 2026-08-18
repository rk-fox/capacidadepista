import React, { useState } from 'react';
import { X, MessageSquare, Save } from 'lucide-react';
import { Flight } from '../types';

interface ObservationModalProps {
  flight: Flight;
  onClose: () => void;
  onSave: (id: string, obs: string) => void;
}

export function ObservationModal({ flight, onClose, onSave }: ObservationModalProps) {
  const [obs, setObs] = useState(flight.observacao || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(flight.id, obs.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container-highest p-6 border border-outline-variant rounded-xl shadow-xl flex flex-col gap-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-primary">
            <MessageSquare size={18} />
            <h3 className="font-label-caps font-bold">OBSERVAÇÃO - {flight.callsign}</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-label-caps text-on-surface-variant">Anotações do Voo</label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex: PRIORIDADE MEDICAL, VIP, ETC..."
              className="w-full bg-surface-container/50 border border-outline-variant p-3 font-data-mono text-on-surface outline-none focus:border-primary/50 rounded-lg uppercase resize-none h-24"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all font-label-caps"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary text-on-primary hover:opacity-90 text-xs font-bold rounded-xl transition-all font-label-caps flex items-center justify-center gap-2 shadow-md"
            >
              <Save size={16} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
