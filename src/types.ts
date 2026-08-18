export type FlightType = 'DEP' | 'ARR' | 'HOLD';

export interface Flight {
  id: string;
  callsign: string;
  type: FlightType;
  airport: string;
  squawk: string;
  aircraft: string;
  wakeTurbulence?: string;
  level: string; // or Level/RTE or LVL/STAR
  route: string; // RTE or STAR or REASON
  runway?: string;
  taxiwayIn?: string;
  taxiwayOut?: string;
  taxiway?: string;
  time?: string; // used for Hold
  inicioTime?: number;
  ingressoTime?: number;
  autorizacaoTime?: number;
  reacaoTime?: number;
  corridaTime?: number;
  faf2Time?: number;
  faf1Time?: number;
  fafTime?: number;
  thrTime?: number;
  pLivreTime?: number;
  finished?: boolean;
  observacao?: string;
}

export interface SystemStatus {
  metar: {
    time: string;
    text: string;
  };
  frequencies: {
    primary: string;
    secondary: string;
    ground: string;
  };
  alerts: {
    id: string;
    type: 'warning' | 'info';
    message: string;
  }[];
}
